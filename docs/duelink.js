export { SerialInterface, DUELinkController }
import { Util } from "./util.js";

class SerialInterface {
    isReady = false;
    isBrowser = false;
    static CommandCompleteText = ">";
    static Decoder = new TextDecoder();
    version = "0.0";
 
    constructor(serial) {
        this.DeviceConfig = new DeviceConfiguration();
        this.portName = serial;
        this.leftOver = "";
        this.ReadTimeout = 3;
        this.echo = true;
        this.isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";;
    }

    async Connect() {
        if (this.isBrowser) {
            await this.portName.connect([{ usbVendorId: 0x1B9F }]);
        } else {
            await this.portName.connect();
        }

        
        this.portName.setTimeout(this.ReadTimeout);
        this.leftOver = "";
        await this.Synchronize();
    }

    async Disconnect() {
        try {
            await this.portName.close();
        } catch { }
        this.port = null;
    }

    async Synchronize() {
        const cmd = new Uint8Array(1);
        cmd[0] = 0x1b;

        await this.WriteRawData(cmd, 0, 1);
        await this.ReadResponse();    
       
        await this.TurnEchoOff();

        const orig = this.portName.getTimeout();
        this.portName.setTimeout(1);
        let tryCount = 3;
        while (tryCount > 0) {
            this.leftOver = "";
            this.portName.resetInputBuffer();
            this.portName.resetOutputBuffer();
            try {
                const version = await this.GetVersion();
                if (version != "" && version[2] == "." && version[4] == ".") {
                    console.log(version);
                    this.isReady = true;
                    break;
                }
            } catch { }
            tryCount -= 1;
            await Util.sleep(10);
        }
        this.portName.setTimeout(orig);
    }

    async TurnEchoOff() {
        if (!this.echo) {
            return;
        }
        await this.WriteCommand("echo(0)");
        await this.ReadResponse();
        this.echo = false;
    }

    async GetVersion() {
        const command = "version()";
        await this.WriteCommand(command);

        const version = await this.ReadResponse();

        if (version.success) {
            if (this.echo && version.response.includes(command)) {
                // echo is on => need to turn off
                this.TurnEchoOff();
                this.portName.resetInputBuffer();
                this.portName.resetOutputBuffer();
                version.response = version.response.slice(command.length);

            }
            this.version = version.response;
        }

        return version.response;
    }

    RemoveEchoresponse(response, cmd) {
        if (cmd in response) {
            response = response.slice(cmd.length);
        }

        return response;
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
        await this.portName.sendString(string);
    }

    async ReadResponse() {
        let str = this.leftOver;
        const response = new Cmdresponse();
        const end = new Date(Date.now() + this.ReadTimeout * 1000);

        while (!this.portName.hasData() && new Date() <= end) {
             await Util.pumpAsync();
        }
        if (!this.portName.hasData()) {
            console.log("No Response");
        }
        
        while (new Date() <= end) {
            const data = await this.portName.read();
            if (data) {
                str += SerialInterface.Decoder.decode(data);
                
                if (str.length > 0) {
                    let idx1 = str.indexOf(">");
                    let idx2 = str.indexOf("&");

                    if (idx1 == -1) {
                        idx1 = str.indexOf("$");
                    }

                    if (idx1 == -1 && idx2 == -1) {
                        continue;
                    }

                    const idx = idx1 == -1 ? idx2 : idx1;

                    this.leftOver = str.slice(idx + 1);
                    response.success = true;
                    response.response = str.slice(0, idx);
            
                    const idx3 = str.indexOf("!");
                    
                    if (idx3 != -1) {
                        response.success = false;
                    }

                    return response;
                }
            }

            this.leftOver = "";

            this.portName.resetInputBuffer();
            this.portName.resetOutputBuffer();
        }
        //debugger;
        response.success = false;
        response.response = "";

        return response;
    }

    static TransferBlockSizeMax = 512;
    static TransferBlockDelay = 5;

    async WriteRawData(buffer, offset, count) {
        const block = Math.floor(count / SerialInterface.TransferBlockSizeMax);
        const remain = count % SerialInterface.TransferBlockSizeMax;

        let idx = offset;

        while (block > 0) {
            await this.portName.write(buffer.slice(idx, idx + SerialInterface.TransferBlockSizeMax));
            idx += SerialInterface.TransferBlockSizeMax;
            block -= 1;
            await Util.sleep(SerialInterface.TransferBlockDelay);
        }

        if (remain > 0) {
            await this.portName.write(buffer.slice(idx, idx + remain));
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

        const data = await this.portName.readN(count);

        if (data.length === 0) {
            return 0;
        }

        for (let i = offset; i < offset + count; i++) {
            buffer[i] = data[i - offset];
        }

        return count;
    }


}

class Cmdresponse {
    constructor() {
        this.response = '';
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
    constructor(serialPort) {
        this.serialPort = serialPort;
        this.Fixed_Frequency = 50;
    }

    async Read(pin) {
        if (pin < 0 || pin >= this.serialPort.DeviceConfig.MaxPinAnalog) {
            throw new Error('Invalid pin');
        }

        const cmd = `print(aread(${pin}))`;

        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();

        if (res.success) {
            try {
                return parseInt(res.response);
            } catch { }
        }

        return -1;
    }

    async Write(pin, duty_cycle) {
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
        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();
    
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

    async Enable(pin, enable) {
        if (pin < 0) throw new Error("Invalid pin.");
        if (pin === 'A' || pin === 'a') pin = 65;
        if (pin === 'B' || pin === 'b') pin = 66;
        if (pin > 2 && pin != 65 && pin != 66) throw new Error("Invalid pin.");
        
        const cmd = `btnenable(${pin}, ${Number(enable)})`;

        await this.serialPort.WriteCommand(cmd);
        const res = await this.serialPort.ReadResponse();

        return res.success;
    }

    async WasPressed(pin) {
        if (pin < 0) throw new Error("Invalid pin.");
        if (pin === 'A' || pin === 'a') pin = 65;
        if (pin === 'B' || pin === 'b') pin = 66;
        if (pin > 2 && pin != 65 && pin != 66) throw new Error("Invalid pin.");
        
        const cmd = `print(btndown(${pin}))`;

        await this.serialPort.WriteCommand(cmd);
        const res = await this.serialPort.ReadResponse();

        if (res.success) {
            try {
                return parseInt(res.response) === 1;
            } catch { 
                console.log("Press EXCEPTION");        
            }
        }

        console.log("Press ERROR");
        return false;
    }

    async IsReleased(pin) {
        if (pin !== 97 && pin !== 98 && pin !== 65 && pin !== 66 && pin !== 0 && pin !== 1 && pin !== 2 && pin !== 'A' && pin !== 'B' && pin !== 'a' && pin !== 'b') {
            throw new Error("Invalid pin.");
        }

        const cmd = `print(btnup(${pin}))`;

        await this.serialPort.WriteCommand(cmd);
        const res = await this.serialPort.ReadResponse();

        if (res.success) {
            try {
                return parseInt(res.response) === 1;
            } catch { }
        }

        return false;
    }
}

class DigitalController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    async Read(pin, inputType = 0) {
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
        await this.serialPort.WriteCommand(cmd);

        const response = await this.serialPort.ReadResponse();

        if (response.success) {
            try {
                const value = parseInt(response.response);
                return value === 1;
            } catch { }
        }

        return false;
    }

    async Write(pin, value) {
        if (pin === 'l' || pin === 'L') {
            pin = 108;
        }

        if (pin < 0 || (pin >= this.serialPort.DeviceConfig.MaxPinIO && pin !== 108)) {
            throw new Error('Invalid pin');
        }

        const cmd = `dwrite(${pin},${value ? 1 : 0})`;
        this.serialPort.WriteCommand(cmd);
        const response = await this.serialPort.ReadResponse();
        return response.success;
    }
}

class DisplayController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }
 
    async Show() {
        let cmd = "lcdshow()";
        await this.serialPort.WriteCommand(cmd);
        let res = await this.serialPort.ReadResponse();
        return res.success;
    }

    async Clear(color) {
        let cmd = `lcdclear(${color})`;
        await this.serialPort.WriteCommand(cmd);
        let res = await this.serialPort.ReadResponse();
        return res.success;
    }

    async SetPixel(color, x, y) {
        let cmd = `lcdpixel(${color},${x},${y})`;
        await this.serialPort.WriteCommand(cmd);
        let res = await this.serialPort.ReadResponse();
        return res.success;
    }

    async DrawCircle(color, x, y, radius) {
        let cmd = `lcdcircle(${color},${x},${y},${radius})`;
        await this.serialPort.WriteCommand(cmd)
        let res = await this.serialPort.ReadResponse();
        return res.success;
    }

    async DrawRectangle(color, x, y, width, height) {
        let cmd = `lcdrect(${color},${x},${y},${width},${height})`;
        await this.serialPort.WriteCommand(cmd);
        let res = await this.serialPort.ReadResponse();
        return res.success;
    }

    async DrawFillRect(color, x, y, width, height) {
        let cmd = `lcdfill(${color},${x},${y},${width},${height})`;
        await this.serialPort.WriteCommand(cmd);
        
        let res = await this.serialPort.ReadResponse();
        return res.success;
    }

    async DrawLine(color, x1, y1, x2, y2) {
        let cmd = `lcdline(${color},${x1},${y1},${x2},${y2})`;
        await this.serialPort.WriteCommand(cmd);
        
        let res = await this.serialPort.ReadResponse();
        return res.success;
    }

    async DrawText(text, color, x, y) {
        let cmd = `lcdtext("${text}",${color},${x},${y})`;
        await this.serialPort.WriteCommand(cmd);
        let res = await this.serialPort.ReadResponse();
        return res.success;
    }

    async DrawTextScale(text, color, x, y, scalewidth, scaleheight) {
        let cmd = `lcdtexts("${text}",${color},${x},${y},${scalewidth},${scaleheight})`;
        await this.serialPort.WriteCommand(cmd);
        
        let res = await this.serialPort.ReadResponse();
        return res.success;
    }

    async __Stream(data) {
        let cmd = "lcdstream()";
        await this.serialPort.WriteCommand(cmd);
        let res = await this.serialPort.ReadResponse();

        if (res.success) {
            this.serialPort.WriteRawData(data, 0, data.length);
            res = await this.serialPort.ReadResponse();
        }

        return res.success;
    }
    async DrawBuffer(color) {
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

        return await this.__Stream(data);
    }

    async DrawBufferBytes(color) {
        let offset = 0;
        const length = color.length;

        if (length % 4 !== 0) {
            throw new Error("length must be multiple of 4");
        }

        const data32 = new Uint32Array(length / 4);

        for (let i = 0; i < data32.length; i++) {
            data32[i] = (color[(i + offset) * 4 + 0] << 0) | (color[(i + offset) * 4 + 1] << 8) | (color[(i + offset) * 4 + 2] << 16) | (color[(i + offset) * 4 + 3] << 24);
        }

        return await this.DrawBuffer(data32);
    }

    async Configuration(target, slaveAddress) {
        const cmd = `lcdconfig(${target},${slaveAddress})`;

        await this.serialPort.WriteCommand(cmd);
        
        const res = await this.serialPort.ReadResponse();
        return res.success;
    }

    async DrawImageScale(img, x, y, scaleWidth, scaleHeight, transform) {
        if (!img) throw new Error("Data null.");

        const width = img[0];
        const height = img[1];

        if (width <= 0 || height <= 0 || img.length < width * height) {
            throw new Error("Invalid arguments");
        }

        let cmd = `dim a[${img.length}]`;

        await this.serialPort.WriteCommand(cmd);
        
        let res = await this.serialPort.ReadResponse();


        for (let i = 0; i < img.length; i++) {
            cmd = `a[${i}] = ${img[i]}`;
            await this.serialPort.WriteCommand(cmd);
            
            res = await this.serialPort.ReadResponse();

            if (res.success === false) {
                break;
            }
        }

        if (res.success === true) {
            cmd = `lcdimgs(a, ${x}, ${y}, ${scaleWidth}, ${scaleHeight}, ${transform})`;

            await this.serialPort.WriteCommand(cmd);
            
            res = await this.serialPort.ReadResponse();
        }


        cmd = "dim a[0]";

        await this.serialPort.WriteCommand(cmd);
        
        res = await this.serialPort.ReadResponse();

        return res.success;
    }

    async DrawImage(img, x, y, transform) {
        return await this.DrawImageScale(img, x, y, 1, 1, transform);
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

    async Read(pulsePin, echoPin) {
        if (pulsePin < 0 || pulsePin >= this.serialPort.DeviceConfig.MaxPinIO) {
            throw new Error('Invalid pin');
        }

        if (echoPin >= this.serialPort.DeviceConfig.MaxPinIO) {
            throw new Error('Invalid pin');
        }

        const cmd = `print(distance(${pulsePin},${echoPin}))`;
        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();

        if (res.success) {
            try {
                const distance = parseFloat(res.response);
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

    async Write(pin, frequency, duration_ms = 0, dutycyle = 500) {
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
        await this.serialPort.WriteCommand(cmd);

        let res = await this.serialPort.ReadResponse();

        return res.success;
    }
}

class HudimityController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    async Read(pin, sensortype) {
        let cmd = `print(humidity(${pin},${sensortype}))`;
        await this.serialPort.WriteCommand(cmd);

        let res = await this.serialPort.ReadResponse();
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
}

class I2cController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    async Write(address, data, offset, length) {
        return await this.WriteRead(address, data, offset, length, null, 0, 0);
    }

    async Read(address, data, offset, length) {
        return await this.WriteRead(address, null, 0, 0, data, offset, length);
    }

    async WriteRead(address, dataWrite, offsetWrite, countWrite, dataRead, offsetRead, countRead) {
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
        await this.serialPort.WriteCommand(cmd);

        if (countWrite > 0) {
            const res = await this.serialPort.ReadResponse();

            if (!res.success) {
                throw new Error("I2c error:" + res.response);
            }

            this.serialPort.WriteRawData(dataWrite, offsetWrite, countWrite);
        }

        if (countRead > 0) {
            if (this.serialPort.ReadRawData(dataRead, offsetRead, countRead) !== countRead) {
                throw new Error("I2C read raw data error.");
            }
        }

        const res = await this.serialPort.ReadResponse();
        return res.success;
    }
}

class InfraredController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    async Read() {
        const cmd = "print(irread())";
        await this.serialPort.WriteCommand(cmd);
        const res = await this.serialPort.ReadResponse();
        if (res.success) {
            try {
                return parseInt(res.response);
            } catch {
                // do nothing
            }
        }
        return -1;
    }

    async Enable(enable) {
        let en = 0;

        if (enable === true) {
            en = 1;
        }

        const cmd = `irenable(${en})`;
        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();

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

    async Set(highPeriod, lowPeriod, count) {
        const cmd = `led(${highPeriod},${lowPeriod},${count})`;
        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();
        return res.success;
    }
}

class NeoController {
    MAX_LED_NUM = 256;

    constructor(serialPort) {
        this.serialPort = serialPort;
        this.SupportLedNumMax = this.MAX_LED_NUM;
    }

    async Show(pin, count) {
        const cmd = `neoshow(${pin}, ${count})`;
        await this.serialPort.WriteCommand(cmd);

        // each led need 1.25us delay blocking mode
        const delay = (this.MAX_LED_NUM * 3 * 8 * 1.25);
        setTimeout(async () => {
            const res = await this.serialPort.ReadResponse();
            return res.success;
        }, delay);
    }

    async Clear() {
        const cmd = "neoclear()";
        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();

        return res.success;
    }

    async SetColor(id, color) {
        const red = (color >> 16) & 0xff;
        const green = (color >> 8) & 0xff;
        const blue = (color >> 0) & 0xff;

        if (id < 0 || id > this.MAX_LED_NUM) {
            return false;
        }

        const cmd = `neoset(${id},${red},${green},${blue})`;
        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();

        return res.success;
    }

    async SetMultiple(pin, color) {
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
        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();

        if (res.success) {
            this.serialPort.WriteRawData(data, 0, data.length);
            const res2 = await this.serialPort.ReadResponse();
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

    async Run() {
        const cmd = "run";
        await this.serialPort.WriteCommand(cmd);
    }

    async New() {
        this.loadscript = "";
        const cmd = "new";
        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();

        return res.success;
    }

    async Load(script) {
        this.loadscript += script;
        this.loadscript += "\n";
    }

    async Record() {
        if (this.loadscript === "") {
            throw new Error("No script for recording.");
        }

        const script = this.loadscript;

        const cmd = "pgmstream()";

        const raw = new TextEncoder().encode(script);

        const data = new Uint8Array(raw.length + 1);

        data[raw.length] = 0;

        data.set(raw, 0);

        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();

        if (res.success === false) {
            return false;
        }

        this.serialPort.WriteRawData(data, 0, data.length);

        const res2 = await this.serialPort.ReadResponse();

        this.loadscript = "";
        return res2.success;
    }

    async __Load2(script) {
        let ret = true;
        const cmd = "$";
        await this.serialPort.WriteCommand(cmd);
        await Util.sleep(1);
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

            await this.serialPort.WriteCommand(subscript);

            const res = await this.serialPort.ReadResponse();

            if (res.success === false) {
                ret = false;
                break;
            }
        }

        const cmd2 = ">";
        await this.serialPort.WriteCommand(cmd2);

        const res2 = await this.serialPort.ReadResponse();

        return ret && res2.success;
    }

    async Read() {
        const cmd = "list";

        await this.serialPort.WriteCommand(cmd);
        const res = await this.serialPort.ReadResponse();

        return res.response;
    }

    async Execute(script) {
        const cmd = script;
        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();

        return res.response;
    }

    async IsRunning() {
        this.serialPort.DiscardInBuffer();

        const dataWrite = new Uint8Array(1);
        const dataRead = new Uint8Array(1);

        dataWrite[0] = 0xFF;
        dataRead[0] = 0x00;

        await this.serialPort.WriteRawData(dataWrite, 0, 1);
        
        const count = await this.serialPort.ReadRawData(dataRead, 0, 1);

        if (count === 0) {
            // if running, should received 0xff
            // it not, need to send '\n' to clear 0xff that was sent.
            dataWrite[0] = 10;
            this.serialPort.WriteRawData(dataWrite, 0, 1);

            await this.serialPort.ReadResponse();
        }

        return dataRead[0] === 0xFF;
    }
}

// Assuming SerialInterface and ValueError classes are already imported

class ServoController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    async Set(pin, position) {
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
        await this.serialPort.WriteCommand(cmd);

        const response = await this.serialPort.ReadResponse();

        return response.success;
    }
}


class SpiController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    async Write(dataWrite, offset, length, chipselect = -1) {
        return await this.WriteRead(dataWrite, offset, length, null, 0, 0, chipselect);
    }

    async Read(dataRead, offset, length, chipselect = -1) {
        return await this.WriteRead(null, 0, 0, dataRead, offset, length, chipselect);
    }

    async WriteRead(dataWrite, offsetWrite, countWrite, dataRead, offsetRead, countRead, chipselect = -1) {
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
        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();

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
                await this.serialPort.WriteRawData(dataWrite, offsetWrite, num);
                offsetWrite += num;
                countWrite -= num;
            }

            if (countRead > 0) {
                await this.serialPort.ReadRawData(dataRead, offsetRead, num);
                offsetRead += num;
                countRead -= num;
            }
        }

        const res2 = await this.serialPort.ReadResponse();
        return res2.success;
    }

    async Write4bpp(dataWrite, offsetWrite, countWrite, chipselect = -1) {
        if (chipselect >= this.serialPort.DeviceConfig.MaxPinIO) {
            throw new Error("InvalidPin");
        }

        if (dataWrite === null || countWrite === 0) {
            throw new Error("Invalid arguments");
        }

        const cmd = `spi4bpp(${countWrite},${chipselect})`;
        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();

        if (!res.success) {
            return false;
        }

        await this.serialPort.WriteRawData(dataWrite, offsetWrite, countWrite);

        const res2 = await this.serialPort.ReadResponse();
        return res2.success;
    }

    async Pallete(id, color) {
        if (id > 16) {
            throw new Error("Pallete supports 16 color index only.");
        }

        const cmd = `palette(${id},${color})`;

        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();
        return res.success;
    }

    async Configuration(mode, frequencyKHz) {
        if (mode > 3 || mode < 0) {
            throw new Error("Mode must be in range 0...3.");
        }

        if (frequencyKHz < 200 || frequencyKHz > 20000) {
            throw new Error("FrequencyKHz must be in range 200KHz to 20MHz.");
        }

        const cmd = `palette(${mode},${frequencyKHz})`;

        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();
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
        this.display = new DisplayController(this.serialPort);
    }

    async Reset(option) {
        let cmd = `reset(${option.value === 1 ? 1 : 0})`;
        await this.serialPort.WriteCommand(cmd);
        this.serialPort.Disconnect();
    }

    async GetTickMicroseconds() {
        let cmd = "print(tickus())";
        await this.serialPort.WriteCommand(cmd);
        let res = await this.serialPort.ReadResponse();
        if (res.success) {
            try {
                return parseInt(res.response);
            } catch { }
        }
        return -1;
    }

    async GetTickMilliseconds() {
        let cmd = "print(tickms())";
        await this.serialPort.WriteCommand(cmd);
        let res = await this.serialPort.ReadResponse();
        if (res.success) {
            try {
                return parseInt(res.response);
            } catch { }
        }
        return -1;
    }

    async Beep(pin, frequency, duration) {
        if (frequency < 0 || frequency > 10000) {
            throw ("Frequency is within range[0,10000] Hz");
        }
        if (duration < 0 || duration > 1000) {
            throw ("duration is within range[0,1000] millisecond");
        }

        let cmd = `beep(${pin}, ${frequency}, ${duration})`;
        await this.serialPort.WriteCommand(cmd);
        let res = await this.serialPort.ReadResponse();
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
            this.displayText[SystemController.DISPLAY_MAX_LINES - 1] =
                this.displayText[SystemController.DISPLAY_MAX_LINES - 1] + c;
            this.print_posx += 1;
        }
        return;
    }

    async __PrnText(text, newline) {
        for (let i = 0; i < text.length; i++) {
            this.__PrnChar(text[i]);
        }
 
        await this.display.Clear(0);
        for (let i = 0; i < this.displayText.length; i++) {
            if (this.displayText[i] !== "") {
                await this.display.DrawText(this.displayText[i], 1, 0, i * 8);
            }
        }
        await this.display.Show();

        if (newline) {
            this.__PrnChar("\r");
        }
    }

    async Print(text) {
        if (typeof text === "string") {
            await this.__PrnText(text, false);
        } else {
            await this.__PrnText(text.toString(), false);
        }

        return true;
    }

    async Println(text) {
        if (typeof text === "string") {
           await this.__PrnText(text, true);
        } else {
           await this.__PrnText(text.toString(), true);
        }

        return true;
    }

    async Wait(millisecond) {
        await Util.sleep(millisecond);
        return true;
    }
}

class TemperatureController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    async Read(pin, sensortype) {
        let cmd = `print(temp(${pin},${sensortype}))`;
        await this.serialPort.WriteCommand(cmd);

        let res = await this.serialPort.ReadResponse();
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

    async Read(pin) {
        const cmd = `print(touchread(${pin}))`;
        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();
        let val = false;
        if (res.success) {
            try {
                val = parseInt(res.response) === 1;
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

    async Enable(baudrate) {
        let cmd = `uartinit(${baudrate})`;
        await this.serialPort.WriteCommand(cmd);
        let res = await this.serialPort.ReadResponse();
        return res.success;
    }

    async Write(data) {
        let cmd = `uartwrite(${data})`;
        await this.serialPort.WriteCommand(cmd);
        let res = await this.serialPort.ReadResponse();
        return res.success;
    }

    async BytesToRead() {
        let cmd = "x=uartcount():print(x)";
        await this.serialPort.WriteCommand(cmd);
        let res = await this.serialPort.ReadResponse();
        if (res.success) {
            try {
                let ready = parseInt(res.response);
                return ready;
            } catch { }
        }
        throw ("BytesToRead error!");
    }

    async Read() {
        let cmd = "x=uartread():print(x)";
        await this.serialPort.WriteCommand(cmd);
        let res = await this.serialPort.ReadResponse();
        if (res.success) {
            try {
                let data = parseInt(res.response);
                return data;
            } catch { }
        }
        throw ("Uart receving error!");
    }
}

class DUELinkController {
    constructor(serial) {
        this.serialPort = new SerialInterface(serial);        
    }

    async InitDevice() {
        if (!this.serialPort) {
            throw (`Not connected to the device.`);
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
    
    async Connect() {
        await this.serialPort.Connect();
        
        this.Version = this.serialPort.version;
        this.Version = this.Version.split("\n")[0];
        this.Version = this.Version.replace("\r", "");
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
        this.InitDevice();
    }

    async Disconnect() {
        await this.serialPort.Disconnect();
    }
}