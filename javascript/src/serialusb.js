import { SerialPort } from 'serialport'
import { RingBuffer } from './util.js';

export {SerialUSB}

class SerialUSB {
    constructor(baudRate=115200) {
        this.baudRate = baudRate;
        this.timeOut = 3;
        this.ring = new RingBuffer(1024);
    }

    async connect() {
        return new Promise(async resolve => {
            var selectPort = await this.detectPort();
            if(selectPort==='') throw new Error("Device not found.");
            
            this.port = new SerialPort({ path: selectPort, baudRate: this.baudRate });
            
            this.port.on('open', () => {
                resolve();
            });

            this.port.on('readable', () => {
                const data = this.port.read();
                for (let c of data) {
                    this.ring.enqueue(c);
                }            
            });
        });
    }

    async detectPort() {
        var selected = ''
        var listPorts = SerialPort.list()
        var items = await listPorts;
        console.log(items)
        items.forEach(item => {
                if(item.serialNumber && item.serialNumber.startsWith('DUE')){
                    selected = item.path;                
                }
            });
        return selected;
    }
    

    async sendString(message) {
        await this.write(message);
    }

    async readN(count) {
        let buffer = new Uint8Array(count);
        let offset = 0;
        while (count > 0) {
            let result = await this.ring.dequeueN(count);
            if (result) {
                let readbuf = this.toArrayBuffer(result);
                buffer.set(readbuf, offset);
                offset += result.length;
                count -= result.length;
            }
        }

        return buffer;
    }

    async read() {
        let result = await this.ring.dequeueAll();
        return result;
    }

    async write(bytedata) {
        //return new Promise(resolve => {
            var buffer = Buffer.from(bytedata);
            this.port.write(buffer);
            //this.port.drain();
        //    resolve();
       //});        
    }

    hasData() {
        return this.ring.hasData();
    }

    close() {
        
    }

    setTimeout(timeout) {
        this.timeOut = timeout;
    }

    getTimeout() {
        return this.timeOut;
    }

    resetInputBuffer() {
        this.ring.clear();
    }

    resetOutputBuffer() {
    }
}
