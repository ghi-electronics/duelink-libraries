class SerialWebUSB {
    constructor(inEndpoint, outEndpoint) {
        this.outEndpoint = outEndpoint;
        this.inEndpoint = inEndpoint;
    }

    async connect(deviceFilters) {
        this.x = 0;

        this.port = await navigator.serial.requestPort({ filters: deviceFilters });
        await this.port.open({ baudRate: 9600 });
        this.writer = this.port.writable.getWriter();
        this.reader = this.port.readable.getReader();
    }

    async sendString(message) {
        let encoder = new TextEncoder();
        let bytes = encoder.encode(message);
        await this.writer.write(bytes);
    }

    async readString() {
        //let messageLengthBuffer = await this.readBytes(1);
        //let messageLength = messageLengthBuffer[0];

        let messageBuffer = await this.readBytes();
        let decoder = new TextDecoder();
        return decoder.decode(messageBuffer);
    }

    async readBytes(count) {
        let buffer = new Uint8Array(count);
        let offset = 0;
        while (count > 0) {
            let result = await this.reader.read();
            if (result.value) {
                buffer.set(new Uint8Array(result.value), offset);
                offset += result.data.byteLength;
                count -= result.data.byteLength;
            }

            if (result.status === 'stall') {
                await this.device.clearHalt(2);
            }
        }

        return buffer;
    }
    async readBytes() {
        var buffer = new Uint8Array();
        let offset = 0;
        let result = await this.reader.read();
        if (result.value) {
            buffer = result.value;
        }

        if (result.status === 'stall') {
            await this.device.clearHalt(2);
        }


        return buffer;
    }
    async read(count) {
        return await this.readBytes(count);
    }
    async read() {
        return this.readString(); //await this.readBytes();
    }
    async write(bytedata) {
        await this.writer.write(bytedata);
    }
    close() {

    }
    timeOut;
    setTimeout(timeout) {
        this.timeOut = timeout;
    }

    getTimeout() {
        return this.timeOut;
    }

    resetInputBuffer() {

    }
    resetOutputBuffer() {

    }
}


class SerialInterface {
    static CommandCompleteText = ">";
    static DefaultBaudRate = 115200;
    version = "0.0";
    //portName;
    //DeviceConfig = new DeviceConfiguration();

    constructor() {
        this.DeviceConfig = new DeviceConfiguration();
        this.portName = new SerialWebUSB(2, 1);
        this.leftOver = "";
        this.ReadTimeout = 3;
        //this.portName = portName;
        this.echo = true;
    }

    async Connect() {
        try {
            await this.portName.connect([{ usbVendorId: 0x1B9F }]);

        } catch (e) {
            console.log("connect Error" + e);
        }
        /*
        this.portName = new serial(this.portName, {
            baudRate: this.DefaultBaudRate,
            parity: "none",
            dataBits: 8,
            stopBits: 1,
        });
        */
        this.portName.setTimeout(this.ReadTimeout);
        this.leftOver = "";
        setTimeout(() => {
            this.Synchronize();
        }, 100);
    }

    Disconnect() {
        try {
            this.portName.close();
        } catch { }
        this.port = null;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async Synchronize() {
        const cmd = new Uint8Array(1);
        cmd[0] = 127;

        this.WriteRawData(cmd, 0, 1);

        const orig = this.portName.getTimeout();
        this.portName.setTimeout(1);
        let tryCount = 3;
        while (tryCount > 0) {
            //setTimeout(() => {
            this.leftOver = "";
            this.portName.resetInputBuffer();
            this.portName.resetOutputBuffer();
            try {
                const version = this.GetVersion();
                if (version != "" && version[2] == "." && version[4] == ".") {
                    break;
                }
            } catch { }
            tryCount -= 1;
            await sleep(10);
            //}, 10);
        }
        this.portName.setTimeout(orig);
    }

    TurnEchoOff() {
        if (!this.echo) {
            return;
        }
        this.WriteCommand("echo(0)");
        this.ReadRespone();
        this.echo = false;
    }

    async GetVersion() {
        const command = "version()";
        await this.WriteCommand(command);

        const version = await this.ReadRespone();

        // this.ReadCommandComplete()

        if (version.success) {
            if (this.echo && version.respone.includes(command)) {
                //if (this.echo) :
                // echo is on => need to turn off
                this.TurnEchoOff();
                this.portName.resetInputBuffer();
                this.portName.resetOutputBuffer();
                version.respone = version.respone.slice(command.length);
               
            }
            this.version = version.respone;
        }

        return version.respone;
    }

    RemoveEchoRespone(respone, cmd) {
        if (cmd in respone) {
            respone = respone.slice(cmd.length);
        }

        return respone;
    }

    // def CheckResult(self, actual, expected):
    //     if actual != expected:
    //         raise Exception(f"Expected {expected}, got {actual}.")
    DiscardInBuffer() {
        this.portName.resetInputBuffer();
    }

    DiscardOutBuffer() {
        this.portName.resetOutputBuffer();
    }

   async WriteCommand(command) {
        this.DiscardInBuffer();
        this.DiscardOutBuffer();
        await this.__WriteLine(command);
    }

    async __WriteLine(string) {
        string += "\n";
        // print(string)
        //this.portName.write(Buffer.from(string, "utf-8"));
        await this.portName.sendString(string);
    }

    async ReadRespone() {
        let str = this.leftOver;
        const end = new Date(Date.now() + this.ReadTimeout * 1000);

        const respone = new CmdRespone();

        while (new Date() < end) {
            const data = await this.portName.read(1);
            str += data.toString();

            str = str.replace("\n", "");
            str = str.replace("\r", "");
            // print(str)
            let idx1 = str.indexOf(">");
            let idx2 = str.indexOf("&");

            if (idx1 == -1) {
                idx1 = str.indexOf("$");
            }

            if (idx1 == -1 && idx2 == -1) {
                continue;
            }

            const idx = idx2 == -1 ? idx1 : idx2;

            this.leftOver = str.slice(idx + 1);
            respone.success = true;
            respone.respone = str.slice(0, idx);
            // print(respone.respone)
            const idx3 = str.indexOf("!");
            //if idx3 != -1 and 'error' in respone.respone:
            //    respone.success = False

            //if idx3 != -1 and 'unknown' in respone.respone:
            //    respone.success = False

            if (idx3 != -1) {
                respone.success = false;
            }

            return respone;
        }

        this.leftOver = "";

        this.portName.resetInputBuffer();
        this.portName.resetOutputBuffer();

        respone.success = false;
        respone.respone = "";

        return respone;
    }

    async ReadRespone2() {
        let str = this.leftOver;
        const end = new Date(Date.now() + this.ReadTimeout * 1000);

        const respone = new CmdRespone();

        while (new Date() < end) {
            const data = await this.portName.read();

            str += data.toString();

            //str = str.replace("  ", "")
            //str = str.replace("\r", "")
            // print(str)
            let idx1 = str.indexOf(">");
            let idx2 = str.indexOf("&");

            if (idx1 == -1) {
                idx1 = str.indexOf("$");
            }

            if (idx1 == -1 && idx2 == -1) {
                continue;
            }

            const idx = idx2 == -1 ? idx1 : idx2;

            this.leftOver = str.slice(idx + 1);
            respone.success = true;
            respone.respone = str.slice(0, idx);
            // print(respone.respone)
            const idx3 = str.indexOf("!");
            if (idx3 != -1 && "error" in respone.respone) {
                respone.success = false;
            }

            if (idx3 != -1 && "unknown" in respone.respone) {
                respone.success = false;
            }

            if (idx3 != -1) {
                respone.success = false;
            }

            return respone;
        }

        this.leftOver = "";

        this.portName.resetInputBuffer();
        this.portName.resetOutputBuffer();

        respone.success = false;
        respone.respone = "";

        return respone;
    }

    static TransferBlockSizeMax = 512;
    static TransferBlockDelay = 0.005;

    async WriteRawData(buffer, offset, count) {
        const block = Math.floor(count / this.TransferBlockSizeMax);
        const remain = count % this.TransferBlockSizeMax;

        let idx = offset;

        while (block > 0) {
            await this.portName.write(buffer.slice(idx, idx + this.TransferBlockSizeMax));
            idx += this.TransferBlockSizeMax;
            block -= 1;
            setTimeout(() => { }, this.TransferBlockDelay);
        }

        if (remain > 0) {
            await this.portName.write(buffer.slice(idx, idx + remain));
            setTimeout(() => { }, this.TransferBlockDelay);
        }
    }

    async ReadRawData(buffer, offset, count) {
        const end = new Date(Date.now() + this.ReadTimeout * 1000);

        if (this.leftOver.length > 0) {
            throw new Error(`LeftOver size is different zero: ${this.leftOver.length}`);
        }

        let countleft = count;
        let totalRead = 0;

        // while (end > new Date()) {
        //   const read = this.portName.readInto(buffer.slice(offset + totalRead, offset + count));
        //   totalRead += read;

        //   if (read > 0) {
        //     end = new Date(Date.now() + this.ReadTimeout * 1000);
        //   }

        //   if (totalRead === count) {
        //     break;
        //   }
        // }

        // return totalRead;

        const data = await this.portName.read(count);

        if (data.length === 0) {
            return 0;
        }

        for (let i = offset; i < offset + count; i++) {
            buffer[i] = data[i - offset];
        }

        return count;
    }
}


class CmdRespone {
    constructor() {
        this.respone = '';
        this.success = false;
    }
}

class DeviceConfiguration {
    constructor() {
        this.IsPulse = false;
        this.IsFlea = false;
        this.IsPico = false;
        this.IsEdge = false;
        this.MaxPinIO = 0;
        this.MaxPinAnalog = 0;
    }
}

class AnalogController {

    //serialPort = new SerialInterface();

    constructor(serialPort) {
        this.serialPort = serialPort;
        this.Fixed_Frequency = 50;
    }

    Read(pin) {
        if (pin < 0 || pin >= this.serialPort.DeviceConfig.MaxPinAnalog) {
            throw new Error('Invalid pin');
        }

        const cmd = `print(aread(${pin}))`;

        this.serialPort.WriteCommand(cmd);

        const res = this.serialPort.ReadRespone();

        if (res.success) {
            try {
                return parseInt(res.respone);
            } catch { }
        }

        return -1;
    }

    Write(pin, duty_cycle) {
        if (pin === 'l' || pin === 'L') {
            pin = 108;
        }

        if (pin < 0 || (pin >= this.serialPort.DeviceConfig.MaxPinIO && pin !== 108)) {
            throw new Error('Invalid pin');
        }

        if (duty_cycle < 0 || duty_cycle > 1000) {
            throw new Error('Duty cycle must be in the range 0..1000');
        }

        const cmd = `awrite(${pin}, ${duty_cycle})`;
        this.serialPort.WriteCommand(cmd);

        const res = this.serialPort.ReadRespone();
        if (res.success) {
            return true;
        }

        return false;
    }
}

class ButtonController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    Enable(pin, enable) {
        if (pin !== 97 && pin !== 98 && pin !== 65 && pin !== 66 && pin !== 0 && pin !== 1 && pin !== 2 && pin !== 'A' && pin !== 'B' && pin !== 'a' && pin !== 'b') {
            throw new Error("Invalid pin.");
        }

        const cmd = `btnenable(${pin}, ${Number(enable)})`;

        this.serialPort.WriteCommand(cmd);
        const res = this.serialPort.ReadRespone();

        return res.success;
    }

    WasPressed(pin) {
        if (pin !== 97 && pin !== 98 && pin !== 65 && pin !== 66 && pin !== 0 && pin !== 1 && pin !== 2 && pin !== 'A' && pin !== 'B' && pin !== 'a' && pin !== 'b') {
            throw new Error("Invalid pin.");
        }

        const cmd = `print(btndown(${pin}))`;

        this.serialPort.WriteCommand(cmd);
        const res = this.serialPort.ReadRespone();

        if (res.success) {
            try {
                return parseInt(res.respone) === 1;
            } catch { }
        }

        return false;
    }

    IsReleased(pin) {
        if (pin !== 97 && pin !== 98 && pin !== 65 && pin !== 66 && pin !== 0 && pin !== 1 && pin !== 2 && pin !== 'A' && pin !== 'B' && pin !== 'a' && pin !== 'b') {
            throw new Error("Invalid pin.");
        }

        const cmd = `print(btnup(${pin}))`;

        this.serialPort.WriteCommand(cmd);
        const res = this.serialPort.ReadRespone();

        if (res.success) {
            try {
                return parseInt(res.respone) === 1;
            } catch { }
        }

        return false;
    }
}


class DigitalController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    Read(pin, inputType = 0) {
        if (pin === 'a' || pin === 'A') {
            pin = 97;
        }

        if (pin === 'b' || pin === 'B') {
            pin = 98;
        }

        if (pin < 0 || (pin >= this.serialPort.DeviceConfig.MaxPinIO && pin !== 97 && pin !== 98 && pin !== 108)) {
            throw new Error('Invalid pin');
        }

        let pull = '0';
        if (inputType === 1) {
            pull = '1';
        } else if (inputType === 2) {
            pull = '2';
        }

        const cmd = `print(dread(${pin},${pull}))`;
        this.serialPort.WriteCommand(cmd);

        const respone = this.serialPort.ReadRespone();

        if (respone.success) {
            try {
                const value = parseInt(respone.respone);
                return value === 1;
            } catch { }
        }

        return false;
    }

    Write(pin, value) {
        if (pin === 'l' || pin === 'L') {
            pin = 108;
        }

        if (pin < 0 || (pin >= this.serialPort.DeviceConfig.MaxPinIO && pin !== 108)) {
            throw new Error('Invalid pin');
        }

        const cmd = `dwrite(${pin},${value ? 1 : 0})`;
        this.serialPort.WriteCommand(cmd);

        const respone = this.serialPort.ReadRespone();

        return respone.success;
    }
}

class DisplayController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    Show() {
        let cmd = "lcdshow()";
        this.serialPort.WriteCommand(cmd);
        let res = this.serialPort.ReadRespone();
        return res.success;
    }

    Clear(color) {
        let cmd = `lcdclear(${color})`;
        this.serialPort.WriteCommand(cmd);
        let res = this.serialPort.ReadRespone();
        return res.success;
    }

    SetPixel(color, x, y) {
        let cmd = `lcdpixel(${color},${x},${y})`;
        this.serialPort.WriteCommand(cmd);
        let res = this.serialPort.ReadRespone();
        return res.success;
    }

    DrawCircle(color, x, y, radius) {
        let cmd = `lcdcircle(${color},${x},${y},${radius})`;
        this.serialPort.WriteCommand(cmd);
        let res = this.serialPort.ReadRespone();
        return res.success;
    }

    DrawRectangle(color, x, y, width, height) {
        let cmd = `lcdrect(${color},${x},${y},${width},${height})`;
        this.serialPort.WriteCommand(cmd);
        let res = this.serialPort.ReadRespone();
        return res.success;
    }

    DrawFillRect(color, x, y, width, height) {
        let cmd = `lcdfill(${color},${x},${y},${width},${height})`;
        this.serialPort.WriteCommand(cmd);
        let res = this.serialPort.ReadRespone();
        return res.success;
    }

    DrawLine(color, x1, y1, x2, y2) {
        let cmd = `lcdline(${color},${x1},${y1},${x2},${y2})`;
        this.serialPort.WriteCommand(cmd);
        let res = this.serialPort.ReadRespone();
        return res.success;
    }

    DrawText(text, color, x, y) {
        let cmd = `lcdtext("${text}",${color},${x},${y})`;
        this.serialPort.WriteCommand(cmd);
        let res = this.serialPort.ReadRespone();
        return res.success;
    }

    DrawTextScale(text, color, x, y, scalewidth, scaleheight) {
        let cmd = `lcdtexts("${text}",${color},${x},${y},${scalewidth},${scaleheight})`;
        this.serialPort.WriteCommand(cmd);
        let res = this.serialPort.ReadRespone();
        return res.success;
    }

    __Stream(data) {
        let cmd = "lcdstream()";
        this.serialPort.WriteCommand(cmd);
        let res = this.serialPort.ReadRespone();

        if (res.success) {
            this.serialPort.WriteRawData(data, 0, data.length);
            // time.sleep(10);
            res = this.serialPort.ReadRespone();
        }

        return res.success;
    }
    DrawBuffer(color) {
        const WIDTH = 128;
        const HEIGHT = 64;

        let offset = 0;
        const length = color.length;

        const data = new Uint8Array(Math.floor(WIDTH * HEIGHT / 8));
        let i = offset;

        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {

                const index = Math.floor(y >> 3) * WIDTH + x;

                if (i < offset + length) {

                    if ((color[i] & 0x00FFFFFF) !== 0) { // no alpha
                        data[index] |= (1 << (y & 7)) & 0xFF;
                    } else {
                        data[index] &= (~(1 << (y & 7))) & 0xFF;
                    }

                    i += 1;
                }
            }
        }

        return this.__Stream(data);
    }

    DrawBufferBytes(color) {
        let offset = 0;
        const length = color.length;

        if (length % 4 !== 0) {
            throw new Error("length must be multiple of 4");
        }

        const data32 = new Uint32Array(length / 4);

        for (let i = 0; i < data32.length; i++) {
            data32[i] = (color[(i + offset) * 4 + 0] << 0) | (color[(i + offset) * 4 + 1] << 8) | (color[(i + offset) * 4 + 2] << 16) | (color[(i + offset) * 4 + 3] << 24);
        }

        return this.DrawBuffer(data32);
    }

    Configuration(target, slaveAddress) {
        const cmd = `lcdconfig(${target},${slaveAddress})`;

        this.serialPort.WriteCommand(cmd);
        const res = this.serialPort.ReadRespone();
        return res.success;
    }

    DrawImageScale(img, x, y, scaleWidth, scaleHeight, transform) {
        const width = img[0];
        const height = img[1];

        if (width <= 0 || height <= 0 || img.length < width * height) {
            throw new Error("Invalid arguments");
        }

        let cmd = `dim a[${img.length}]`;

        this.serialPort.WriteCommand(cmd);
        let res = this.serialPort.ReadRespone();


        for (let i = 0; i < img.length; i++) {
            cmd = `a[${i}] = ${img[i]}`;
            this.serialPort.WriteCommand(cmd);
            res = this.serialPort.ReadRespone();

            if (res.success === false) {
                break;
            }
        }

        if (res.success === true) {
            cmd = `lcdimgs(a, ${x}, ${y}, ${scaleWidth}, ${scaleHeight}, ${transform})`;

            this.serialPort.WriteCommand(cmd);
            res = this.serialPort.ReadRespone();
        }


        cmd = "dim a[0]";

        this.serialPort.WriteCommand(cmd);
        res = this.serialPort.ReadRespone();

        return res.success;
    }

    DrawImage(img, x, y, transform) {
        return this.DrawImageScale(img, x, y, 1, 1, transform);
    }

    __get_transform_none() {
        return 0;
    }
    __get_transform_fliphorizontal() {
        return 1;
    }
    __get_transform_flipvertical() {
        return 2;
    }
    __get_transform_rotate90() {
        return 3;
    }
    __get_transform_rotate180() {
        return 4;
    }
    __get_transform_rotate270() {
        return 5;
    }
    __set_transform() {
        return;
    }

    get TransformNone() {
        return this.__get_transform_none();
    }
    get TransformFlipHorizontal() {
        return this.__get_transform_fliphorizontal();
    }
    get TransformFlipVertical() {
        return this.__get_transform_flipvertical();
    }
    get TransformRotate90() {
        return this.__get_transform_rotate90();
    }
    get TransformRotate180() {
        return this.__get_transform_rotate180();
    }
    get TransformRotate270() {
        return this.__get_transform_rotate270();
    }
}

class DistanceSensorController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    Read(pulsePin, echoPin) {
        if (pulsePin < 0 || pulsePin >= this.serialPort.DeviceConfig.MaxPinIO) {
            throw new Error('Invalid pin');
        }

        if (echoPin >= this.serialPort.DeviceConfig.MaxPinIO) {
            throw new Error('Invalid pin');
        }

        const cmd = `print(distance(${pulsePin},${echoPin}))`;
        this.serialPort.WriteCommand(cmd);

        const res = this.serialPort.ReadRespone();

        if (res.success) {
            try {
                const distance = parseFloat(res.respone);
                return distance;
            } catch (error) {
                // do nothing
            }
        }

        return -1;
    }
}

class FrequencyController {
    constructor(serialPort) {
        this.serialPort = serialPort;
        this.MaxFrequency = 1000000;
        this.MinFrequency = 16;
    }

    Write(pin, frequency, duration_ms = 0, dutycyle = 500) {
        if (frequency < this.MinFrequency || frequency > this.MaxFrequency) {
            throw new Error("Frequency must be in range 16Hz..1000000Hz");
        }

        if (duration_ms > 99999999) {
            throw new Error("duration_ms must be in range 0..99999999");
        }

        if (dutycyle < 0 || dutycyle > 1000) {
            throw new Error("dutycyle must be in range 0..1000");
        }

        if (pin == 'p' || pin == 'P') {
            pin = 112;
        }

        let cmd = `freq(${pin}, ${frequency}, ${duration_ms}, ${dutycyle})`;
        this.serialPort.WriteCommand(cmd);

        let res = this.serialPort.ReadRespone();

        return res.success;
    }
}

class HudimityController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    Read(pin, sensortype) {
        let cmd = `print(humidity(${pin},${sensortype}))`;
        this.serialPort.WriteCommand(cmd);

        let res = this.serialPort.ReadRespone();
        return res.success;
    }

    get Dht11() {
        return 11;
    }

    get Dht12() {
        return 12;
    }

    get Dht21() {
        return 21;
    }

    get Dht22() {
        return 22;
    }

    //set Dht() {}

    __set_dht() { }
}

class I2cController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    Write(address, data, offset, length) {
        return this.WriteRead(address, data, offset, length, null, 0, 0);
    }

    Read(address, data, offset, length) {
        return this.WriteRead(address, null, 0, 0, data, offset, length);
    }

    WriteRead(address, dataWrite, offsetWrite, countWrite, dataRead, offsetRead, countRead) {
        if ((dataWrite === null && dataRead === null) || (countWrite === 0 && countRead === 0)) {
            throw new Error("At least one of dataWrite or dataRead must be specified");
        }

        if (dataWrite === null && countWrite !== 0) {
            throw new Error("dataWrite null but countWrite not zero");
        }

        if (dataRead === null && countRead !== 0) {
            throw new Error("dataRead null but countRead not zero");
        }

        if (dataWrite !== null && offsetWrite + countWrite > dataWrite.length) {
            throw new Error("Invalid range for dataWrite");
        }

        if (dataRead !== null && offsetRead + countRead > dataRead.length) {
            throw new Error("Invalid range for dataRead");
        }

        const cmd = `i2cstream(${address},${countWrite},${countRead})`;
        this.serialPort.WriteCommand(cmd);

        if (countWrite > 0) {
            const res = this.serialPort.ReadRespone();

            if (!res.success) {
                throw new Error("I2c error:" + res.respone);
            }

            this.serialPort.WriteRawData(dataWrite, offsetWrite, countWrite);
        }

        if (countRead > 0) {
            if (this.serialPort.ReadRawData(dataRead, offsetRead, countRead) !== countRead) {
                throw new Error("I2C read raw data error.");
            }
        }

        const res = this.serialPort.ReadRespone();
        return res.success;
    }
}

class InfraredController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    Read() {
        const cmd = "print(irread())";
        this.serialPort.WriteCommand(cmd);
        const res = this.serialPort.ReadRespone();
        if (res.success) {
            try {
                return parseInt(res.respone);
            } catch {
                // do nothing
            }
        }
        return -1;
    }

    Enable(enable) {
        let en = 0;

        if (enable === true) {
            en = 1;
        }

        const cmd = `irenable(${en})`;
        this.serialPort.WriteCommand(cmd);

        const res = this.serialPort.ReadRespone();

        if (res.success) {
            return true;
        }

        return false;
    }
}

class LedController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    Set(highPeriod, lowPeriod, count) {
        const cmd = `led(${highPeriod},${lowPeriod},${count})`;
        this.serialPort.WriteCommand(cmd);

        const res = this.serialPort.ReadRespone();
        return res.success;
    }
}

class NeoController {
    MAX_LED_NUM = 256;

    constructor(serialPort) {
        this.serialPort = serialPort;
        this.SupportLedNumMax = this.MAX_LED_NUM;
    }

    Show(pin, count) {
        const cmd = `neoshow(${pin}, ${count})`;
        this.serialPort.WriteCommand(cmd);

        // each led need 1.25us delay blocking mode
        const delay = (this.MAX_LED_NUM * 3 * 8 * 1.25) / 1000000;
        setTimeout(() => {
            const res = this.serialPort.ReadRespone();
            return res.success;
        }, delay);
    }

    Clear() {
        const cmd = "neoclear()";
        this.serialPort.WriteCommand(cmd);

        const res = this.serialPort.ReadRespone();

        return res.success;
    }

    SetColor(id, color) {
        const red = (color >> 16) & 0xff;
        const green = (color >> 8) & 0xff;
        const blue = (color >> 0) & 0xff;

        if (id < 0 || id > this.MAX_LED_NUM) {
            return false;
        }

        const cmd = `neoset(${id},${red},${green},${blue})`;
        this.serialPort.WriteCommand(cmd);

        const res = this.serialPort.ReadRespone();

        return res.success;
    }

    SetMultiple(pin, color) {
        if (color.length > this.MAX_LED_NUM) {
            return false;
        }

        const length = color.length;
        let offset = 0;

        const data = new Uint8Array(length * 3);

        for (let i = offset; i < length + offset; i++) {
            data[(i - offset) * 3 + 0] = (color[i] >> 16) & 0xff;
            data[(i - offset) * 3 + 1] = (color[i] >> 8) & 0xff;
            data[(i - offset) * 3 + 2] = (color[i] >> 0) & 0xff;
        }

        const cmd = `neostream(${pin}, ${data.length})`;
        this.serialPort.WriteCommand(cmd);

        const res = this.serialPort.ReadRespone();

        if (res.success) {
            this.serialPort.WriteRawData(data, 0, data.length);
            const res2 = this.serialPort.ReadRespone();
            return res2.success;
        }

        return res.success;
    }
}

class PinController {
    constructor() { }

    __get_button_a() {
        return 97;
    }

    __get_button_b() {
        return 98;
    }

    __get_led() {
        return 108;
    }

    __get_piezo() {
        return 112;
    }

    __get_pullnone() {
        return 0;
    }

    __get_pullup() {
        return 1;
    }

    __get_pulldown() {
        return 2;
    }

    __set_empty(value) {
        return;
    }

    get ButtonA() {
        return this.__get_button_a();
    }

    get ButtonB() {
        return this.__get_button_b();
    }

    get Led() {
        return this.__get_led();
    }

    get Piezo() {
        return this.__get_piezo();
    }

    get PullNone() {
        return this.__get_pullnone();
    }

    get PullUp() {
        return this.__get_pullup();
    }

    get PullDown() {
        return this.__get_pulldown();
    }
}


class ScriptController {
    constructor(serialPort) {
        this.serialPort = serialPort;
        this.loadscript = "";
    }

    Run() {
        const cmd = "run";
        this.serialPort.WriteCommand(cmd);
        time.sleep(0.001);
    }

    New() {
        this.loadscript = "";
        const cmd = "new";
        this.serialPort.WriteCommand(cmd);

        const res = this.serialPort.ReadRespone();

        return res.success;
    }

    Load(script) {
        this.loadscript += script;
        this.loadscript += "\n";
    }

    Record() {
        if (this.loadscript === "") {
            throw new Error("No script for recording.");
        }

        const script = this.loadscript;

        const cmd = "pgmstream()";

        const raw = new TextEncoder().encode(script);

        const data = new Uint8Array(raw.length + 1);

        data[raw.length] = 0;

        data.set(raw, 0);

        this.serialPort.WriteCommand(cmd);

        const res = this.serialPort.ReadRespone();

        if (res.success === false) {
            return false;
        }

        this.serialPort.WriteRawData(data, 0, data.length);

        const res2 = this.serialPort.ReadRespone();

        this.loadscript = "";
        return res2.success;
    }

    __Load2(script) {
        let ret = true;
        const cmd = "$";
        this.serialPort.WriteCommand(cmd);
        time.sleep(0.001);
        script = script.replace("\r", "");

        let startIdx = 0;

        for (let i = 0; i < script.length; i++) {
            let subscript = "";

            if (script[i] === "\n") {
                subscript = script.substring(startIdx, i - startIdx);
                startIdx = i + 1;
            } else if (i === script.length - 1) {
                subscript = script.substring(startIdx, i - startIdx + 1);
            }

            this.serialPort.WriteCommand(subscript);

            const res = this.serialPort.ReadRespone();

            if (res.success === false) {
                ret = false;
                break;
            }
        }

        const cmd2 = ">";
        this.serialPort.WriteCommand(cmd2);

        const res2 = this.serialPort.ReadRespone();

        return ret && res2.success;
    }

    Read() {
        const cmd = "list";

        this.serialPort.WriteCommand(cmd);
        const res = this.serialPort.ReadRespone2();

        return res.respone;
    }

    Execute(script) {
        const cmd = script;
        this.serialPort.WriteCommand(cmd);

        const res = this.serialPort.ReadRespone();

        return res.respone;
    }

    IsRunning() {
        this.serialPort.DiscardInBuffer();

        const dataWrite = new Uint8Array(1);
        const dataRead = new Uint8Array(1);

        dataWrite[0] = 0xFF;
        dataRead[0] = 0x00;

        this.serialPort.WriteRawData(dataWrite, 0, 1);
        time.sleep(0.001);

        const count = this.serialPort.ReadRawData(dataRead, 0, 1);

        if (count === 0) {
            // if running, should received 0xff
            // it not, need to send '\n' to clear 0xff that was sent.
            dataWrite[0] = 10;
            this.serialPort.WriteRawData(dataWrite, 0, 1);

            this.serialPort.ReadRespone();
        }

        return dataRead[0] === 0xFF;
    }
}

// Assuming SerialInterface and ValueError classes are already imported

class ServoController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    Set(pin, position) {
        if (pin < 0 || pin >= this.serialPort.DeviceConfig.MaxPinIO) {
            console.log('Invalid pin');
            //throw new ValueError('Invalid pin');
            return false;
        }
        if (position < 0 || position > 180) {
            //throw new ValueError('Position must be in the range 0..180');
            console.log('Position must be in the range 0..180');
            return false;
        }

        const cmd = `servoset(${pin}, ${position})`;
        this.serialPort.WriteCommand(cmd);

        const response = this.serialPort.ReadRespone();

        return response.success;
    }
}


class SpiController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    Write(dataWrite, offset, length, chipselect = -1) {
        return this.WriteRead(dataWrite, offset, length, null, 0, 0, chipselect);
    }

    Read(dataRead, offset, length, chipselect = -1) {
        return this.WriteRead(null, 0, 0, dataRead, offset, length, chipselect);
    }

    WriteRead(dataWrite, offsetWrite, countWrite, dataRead, offsetRead, countRead, chipselect = -1) {
        if (chipselect >= this.serialPort.DeviceConfig.MaxPinIO) {
            throw new Error("InvalidPin");
        }

        if ((dataWrite === null && dataRead === null) || (countWrite === 0 && countRead === 0)) {
            throw new Error("Invalid arguments");
        }

        if (dataWrite !== null && offsetWrite + countWrite > dataWrite.length) {
            throw new Error("Invalid arguments");
        }

        if (dataRead !== null && offsetRead + countRead > dataRead.length) {
            throw new Error("Invalid arguments");
        }

        if (chipselect < 0) {
            chipselect = 255;
        }

        const cmd = `spistream(${countWrite},${countRead},${chipselect})`;
        this.serialPort.WriteCommand(cmd);

        const res = this.serialPort.ReadRespone();

        if (!res.success) {
            return false;
        }

        while (countWrite > 0 || countRead > 0) {
            let num = countRead;

            if (countWrite < countRead) {
                num = countWrite;
            }

            if (countWrite === 0) {
                num = countRead;
            }

            if (countRead === 0) {
                num = countWrite;
            }

            if (num > this.serialPort.TransferBlockSizeMax) {
                num = this.serialPort.TransferBlockSizeMax;
            }

            if (countWrite > 0) {
                this.serialPort.WriteRawData(dataWrite, offsetWrite, num);
                offsetWrite += num;
                countWrite -= num;
            }

            if (countRead > 0) {
                this.serialPort.ReadRawData(dataRead, offsetRead, num);
                offsetRead += num;
                countRead -= num;
            }
        }

        const res2 = this.serialPort.ReadRespone();
        return res2.success;
    }

    Write4bpp(dataWrite, offsetWrite, countWrite, chipselect = -1) {
        if (chipselect >= this.serialPort.DeviceConfig.MaxPinIO) {
            throw new Error("InvalidPin");
        }

        if (dataWrite === null || countWrite === 0) {
            throw new Error("Invalid arguments");
        }

        const cmd = `spi4bpp(${countWrite},${chipselect})`;
        this.serialPort.WriteCommand(cmd);

        const res = this.serialPort.ReadRespone();

        if (!res.success) {
            return false;
        }

        this.serialPort.WriteRawData(dataWrite, offsetWrite, countWrite);

        const res2 = this.serialPort.ReadRespone();
        return res2.success;
    }

    Pallete(id, color) {
        if (id > 16) {
            throw new Error("Pallete supports 16 color index only.");
        }

        const cmd = `palette(${id},${color})`;

        this.serialPort.WriteCommand(cmd);

        const res = this.serialPort.ReadRespone();
        return res.success;
    }

    Configuration(mode, frequencyKHz) {
        if (mode > 3 || mode < 0) {
            throw new Error("Mode must be in range 0...3.");
        }

        if (frequencyKHz < 200 || frequencyKHz > 20000) {
            throw new Error("FrequencyKHz must be in range 200KHz to 20MHz.");
        }

        const cmd = `palette(${mode},${frequencyKHz})`;

        this.serialPort.WriteCommand(cmd);

        const res = this.serialPort.ReadRespone();
        return res.success;
    }
}

class SystemController {
    static DISPLAY_MAX_LINES = 8;
    static DISPLAY_MAX_CHARACTER_PER_LINE = 21;

    constructor(serialPort) {
        this.serialPort = serialPort;
        this.print_posx = 0;
        this.displayText = ["", "", "", "", "", "", "", ""];
    }

    Reset(option) {
        let cmd = `reset(${option.value === 1 ? 1 : 0})`;
        this.serialPort.WriteCommand(cmd);
        this.serialPort.Disconnect();
    }

    GetTickMicroseconds() {
        let cmd = "print(tickus())";
        this.serialPort.WriteCommand(cmd);
        let res = this.serialPort.ReadRespone();
        if (res.success) {
            try {
                return parseInt(res.respone);
            } catch { }
        }
        return -1;
    }

    GetTickMilliseconds() {
        let cmd = "print(tickms())";
        this.serialPort.WriteCommand(cmd);
        let res = this.serialPort.ReadRespone();
        if (res.success) {
            try {
                return parseInt(res.respone);
            } catch { }
        }
        return -1;
    }

    Beep(pin, frequency, duration) {
        if (frequency < 0 || frequency > 10000) {
            throw ("Frequency is within range[0,10000] Hz");
        }
        if (duration < 0 || duration > 1000) {
            throw ("duration is within range[0,1000] millisecond");
        }

        let cmd = `beep(${pin}, ${frequency}, ${duration})`;
        this.serialPort.WriteCommand(cmd);
        let res = this.serialPort.ReadRespone();
        return res.success;
    }

    __PrnChar(c) {
        if (
            this.print_posx === SystemController.DISPLAY_MAX_CHARACTER_PER_LINE &&
            c !== "\r" &&
            c !== "\n"
        ) {
            return;
        }

        if (c === "\r" || c === "\n") {
            this.print_posx = 0;

            for (let i = 1; i < SystemController.DISPLAY_MAX_LINES; i++) {
                this.displayText[i - 1] = this.displayText[i];
            }

            this.displayText[SystemController.DISPLAY_MAX_LINES - 1] = "";
        } else {
            this.displayText[SystemController.DISPLAY_MAX_LINES - 1] +=
                this.displayText[SystemController.DISPLAY_MAX_LINES - 1] + c;
            this.print_posx += 1;
        }
        return;
    }

    __PrnText(text, newline) {
        for (let i = 0; i < text.length; i++) {
            this.__PrnChar(text[i]);
        }

        let display = new DisplayController(this.serialPort);
        display.Clear(0);

        for (let i = 0; i < this.displayText.length; i++) {
            if (this.displayText[i] !== "") {
                display.DrawText(this.displayText[i], 1, 0, i * 8);
            }
        }

        display.Show();

        if (newline) {
            this.__PrnChar("\r");
        }
    }

    Print(text) {
        console.log(text);

        if (typeof text === "string") {
            this.__PrnText(text, false);
        } else {
            this.__PrnText(text.toString(), false);
        }

        return true;
    }

    Println(text) {
        console.log(text);
        if (typeof text === "string") {
            this.__PrnText(text, true);
        } else {
            this.__PrnText(text.toString(), true);
        }

        return true;
    }

    Wait(millisecond) {
        let cmd = `wait(${millisecond})`;
        this.serialPort.WriteCommand(cmd);
        setTimeout(() => {
            this.serialPort.ReadRespone();
        }, millisecond);
        return true;
    }
}

class TemperatureController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    Read(pin, sensortype) {
        let cmd = `print(temp(${pin},${sensortype}))`;
        this.serialPort.WriteCommand(cmd);

        let res = this.serialPort.ReadRespone();
        return res.success;
    }

    __get_dht11() {
        return 11;
    }

    __get_dht12() {
        return 12;
    }

    __get_dht21() {
        return 21;
    }

    __get_dht22() {
        return 22;
    }

    __set_dht() {
        return;
    }

    get Dht11() {
        return this.__get_dht11();
    }

    get Dht12() {
        return this.__get_dht12();
    }

    get Dht21() {
        return this.__get_dht21();
    }

    get Dht22() {
        return this.__get_dht22();
    }
}

class TouchController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    Read(pin) {
        const cmd = `print(touchread(${pin}))`;
        this.serialPort.WriteCommand(cmd);

        const res = this.serialPort.ReadRespone();
        let val = false;
        if (res.success) {
            try {
                val = parseInt(res.respone) === 1;
                return val;
            } catch { }
        }
        return val;
    }
}

class UartController {
    constructor(serialport) {
        this.serialport = serialport;
    }

    Enable(baudrate) {
        let cmd = `uartinit(${baudrate})`;
        this.serialport.WriteCommand(cmd);
        let res = this.serialport.ReadRespone();
        return res.success;
    }

    Write(data) {
        let cmd = `uartwrite(${data})`;
        this.serialport.WriteCommand(cmd);
        let res = this.serialport.ReadRespone();
        return res.success;
    }

    BytesToRead() {
        let cmd = "x=uartcount():print(x)";
        this.serialport.WriteCommand(cmd);
        let res = this.serialport.ReadRespone();
        if (res.success) {
            try {
                let ready = parseInt(res.respone);
                return ready;
            } catch { }
        }
        throw ("BytesToRead error!");
    }

    Read() {
        let cmd = "x=uartread():print(x)";
        this.serialport.WriteCommand(cmd);
        let res = this.serialport.ReadRespone();
        if (res.success) {
            try {
                let data = parseInt(res.respone);
                return data;
            } catch { }
        }
        throw ("Uart receving error!");
    }
}

class DUELinkController {
    constructor(serialinterface) {
        try {
            this.Connect(serialinterface);
        } catch {
            throw (`Could not connect to the comport`);
        }

        if (this.serialPort === null) {
            throw (`serialPort is null`);
        }

        this.Analog = new AnalogController(this.serialPort);
        this.Digital = new DigitalController(this.serialPort);
        this.I2c = new I2cController(this.serialPort);
        this.Servo = new ServoController(this.serialPort);
        this.Frequency = new FrequencyController(this.serialPort);
        this.Spi = new SpiController(this.serialPort);
        this.Infrared = new InfraredController(this.serialPort);
        this.Neo = new NeoController(this.serialPort);
        this.System = new SystemController(this.serialPort);
        this.Uart = new UartController(this.serialPort);
        this.Button = new ButtonController(this.serialPort);
        this.Distance = new DistanceSensorController(this.serialPort);
        this.Display = new DisplayController(this.serialPort);
        this.Touch = new TouchController(this.serialPort);
        this.Led = new LedController(this.serialPort);
        this.Script = new ScriptController(this.serialPort);
        this.Pin = new PinController();
        this.Temperature = new TemperatureController(this.serialPort);
        this.Humidity = new HudimityController(this.serialPort);
    }

    async Connect(serialinterface) {
        this.serialPort = serialinterface;
        //this.serialPort = new SerialInterface();
        //this.serialPort.Connect();

        this.Version = this.serialPort.version;
        this.Version = this.Version.split("\n")[0];

        if (this.Version === "" || this.Version.length !== 7) {
            throw ("The device is not supported.");
        }

        this.DeviceConfig = new DeviceConfiguration();

        if (this.Version[this.Version.length - 1] === "P") {
            this.DeviceConfig.IsPulse = true;
            this.DeviceConfig.MaxPinIO = 23;
            this.DeviceConfig.MaxPinAnalog = 29;
        } else if (this.Version[this.Version.length - 1] === "I") {
            this.DeviceConfig.IsPico = true;
            this.DeviceConfig.MaxPinIO = 29;
            this.DeviceConfig.MaxPinAnalog = 29;
        } else if (this.Version[this.Version.length - 1] === "F") {
            this.DeviceConfig.IsFlea = true;
            this.DeviceConfig.MaxPinIO = 11;
            this.DeviceConfig.MaxPinAnalog = 29;
        } else if (this.Version[this.Version.length - 1] === "E") {
            this.DeviceConfig.IsFlea = true;
            this.DeviceConfig.MaxPinIO = 22;
            this.DeviceConfig.MaxPinAnalog = 11;
        }

        this.serialPort.DeviceConfig = this.DeviceConfig;
    }

    Disconnect() {
        this.serialPort.Disconnect();
    }


}