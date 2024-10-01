export {Util, RingBuffer}
class Util {
    static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static async pumpAsync() {
        return new Promise(resolve => setImmediate(resolve));
    }

    static encoder = new TextEncoder();
    static decoder = new TextDecoder();
}

class RingBuffer {
    constructor(size) {
        this.size = size;
        this.buffer = new Uint8Array(size);
        this.head = this.tail = this.bytesAvailable = 0;
    }

    enqueue(b) {
        this.bytesAvailable++;

        if (this.bytesAvailable === this.size) {
            this.head = (this.head+1) % this.size; 
        }
        this.buffer[this.tail] = b;
        this.tail = (this.tail+1) % this.size;
    }

    async dequeue() {
        return new Promise(resolve => {
            setImmediate(async () => {
                if (this.bytesAvailable === 0) await Util.pumpAsync();
                if (this.bytesAvailable === 0) 
                {   
                    resolve(null); 
                } else {
                    const b = this.buffer[this.head];
                    this.head = (this.head+1) % this.size;
                    this.bytesAvailable--;
                    resolve(b);
                }
            });
        });
    }

    async dequeueN(count) {
        if (this.bytesAvailable === 0) await Util.pumpAsync();
        if (this.bytesAvailable === 0) return null;
        if (this.bytesAvailable < count) count = this.bytesAvailable;
        var bytes = new Uint8Array(count);
        for (let i = 0; i < count; i++) {
            bytes[i] = await this.dequeue();
        }
        return bytes;
    }

    async dequeueAll() {
        if (this.bytesAvailable === 0) await Util.pumpAsync();
        return await this.dequeueN(this.bytesAvailable);
    }

    clear() {
        this.head = this.tail = this.bytesAvailable = 0;
    }

    hasData() {
        return this.bytesAvailable > 0;
    }
}