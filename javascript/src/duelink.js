export { SerialInterface, DUELinkController, CanMessage }
import { Util } from "./util.js";

class SerialInterface {
    isReady = false;
    isBrowser = false;
    static CommandCompleteText = ">";
    static Decoder = new TextDecoder();
    version = "0.0";

    constructor(serial) {
        this.DeviceConfig = null;
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
        await Util.sleep(100);
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
        cmd[0] = 0x7F;

        await this.WriteRawData(cmd, 0, 1);


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
                await this.TurnEchoOff();
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

                let size = 0;

                for (let i = 0; i < data.length; i++) {
                    if (data[i] != 10 && data[i] != 13)   {
                        size = size + 1;
                    }

                }

                if (size == 0) {
                    continue;
                }

                let newData = new Uint8Array(size);
                let indexArray = 0;

                for (let i = 0; i < data.length; i++) {
                    if (data[i] != 10 && data[i] != 13)   {
                        newData[indexArray] = data[i]
                        indexArray++;
                    }

                }

                str += SerialInterface.Decoder.decode(newData);

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
        let block = Math.floor(count / SerialInterface.TransferBlockSizeMax);
        const remain = count % SerialInterface.TransferBlockSizeMax;

        let idx = offset;

        while (block > 0) {
            await this.portName.write(buffer.slice(idx, idx + SerialInterface.TransferBlockSizeMax));
            idx += SerialInterface.TransferBlockSizeMax;
            block--;
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
        this.IsRave = false;
		this.IsTick = false;
		this.IsDue = false;
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

        const cmd = `log(aread(${pin}))`;

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

class BluetoothController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    async SetName(name) {
        if (typeof name != 'string') {
            throw new Error("Invalid name");
        }

        const cmd = `wname("${name}", ${name.length})`; 

        await this.serialPort.WriteCommand(cmd);
        const res = await this.serialPort.ReadResponse();

        return res.success;
    }

    async SetSpeed(speed) {
        if (speed != 115200 && speed != 9600) {
            throw new Error("Support speed 9600 or 115200 only");
        }

        const cmd = `wspeed(${speed})`; 

        await this.serialPort.WriteCommand(cmd);
        const res = await this.serialPort.ReadResponse();

        return res.success;
    }

    async SetPinCode(pinCode) {
        if (typeof pinCode != 'string' || pinCode.length != 4) {
            throw new Error("Invalid pinCode");
        }

        const cmd = `wcode("${pinCode}")`; 

        await this.serialPort.WriteCommand(cmd);
        const res = await this.serialPort.ReadResponse();

        return res.success;
    }
}

class ButtonController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    IsButtonValid(pin) {
		if (pin != 0 && pin != 1 && pin != 2 &&  pin != 3 && pin != 4 && pin != 13 && pin != 14 && pin != 15 && pin != 16 && pin != 65 && pin != 66 && pin != 68 && pin != 76 && pin != 82 && pin != 85) {
			return false;
		}

		return true;
	}

	async Enable(pin, enable) {
        pin = (typeof pin === 'string' ? pin.charCodeAt(0) : pin) & 0xdf;
        if (IsButtonValid(pin) == false) {
            throw new Error("Invalid pin");
        }

        const cmd = `btnenable(${pin}, ${Number(enable)})`;

        await this.serialPort.WriteCommand(cmd);
        const res = await this.serialPort.ReadResponse();

        return res.success;
    }

    async JustPressed(pin) {
        pin = (typeof pin === 'string' ? pin.charCodeAt(0) : pin) & 0xdf;
        if (IsButtonValid(pin) == false) {
            throw new Error("Invalid pin");
        }

        const cmd = `log(btndown(${pin}))`;

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

    async JustReleased(pin) {
        pin = (typeof pin === 'string' ? pin.charCodeAt(0) : pin) & 0xdf;
        if (IsButtonValid(pin) == false) {
            throw new Error("Invalid pin");
        }

        const cmd = `log(btnup(${pin}))`;

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

class CanMessage {
	constructor(id, extended, remoteRequest, data, offset, length) {
        this.Id = id
        this.Extended = extended
        this.RemoteRequest = remoteRequest
        this.Length = length
		this.Data = new Uint8Array(8);
		
		for (let i = offset; i < offset + length; i++) {
            this.Data[i - offset] = data[i]
        }
    }
}

class CanController {
	constructor(serialPort) {
        this.serialPort = serialPort;
    }
	
	async Initialize(bitrate) {
		if (bitrate != 125000 && bitrate != 250000 && bitrate != 500000 && bitrate != 1000000)
			throw new Error('Bit rate must be 125_000, 250_000, 500_000, 1000_000');
		
		const cmd = `caninit(${bitrate})`;
        await this.serialPort.WriteCommand(cmd);

        const response = await this.serialPort.ReadResponse(); 

        return response.success;
	}
	
	async InitializeExt(phase1,  phase2, prescaler, synchronizationJumpWidth) {			
		const cmd = `caninitext(${phase1}, ${phase2}, ${prescaler}, ${synchronizationJumpWidth})`;
        await this.serialPort.WriteCommand(cmd);

        const response = await this.serialPort.ReadResponse(); 

        return response.success;
	}
	
	async Available() {
		const cmd = `log(canavailable())`;

        await this.serialPort.WriteCommand(cmd);
        const res = await this.serialPort.ReadResponse();

        if (res.success) {
            try {
                return parseInt(res.response);
            } catch { }
        }

        return -1;
	}
	
	async WriteMessage(message) {
		let data = new Uint8Array(16);
		
		data[0] = ((message.Id >> 24) & 0xFF)
        data[1] = ((message.Id >> 16) & 0xFF)
        data[2] = ((message.Id >> 8) & 0xFF)
        data[3] = ((message.Id >> 0) & 0xFF)

        if (!message.Extended)
            data[4] = 0
        else
            data[4] = 1

        if (!message.RemoteRequest)
            data[5] = 0
        else
            data[5] = 1
		
        data[6] = message.Length
        data[7] = 0 
		
		for (let i = 0; i < 8; i++) {
            data[i + 8] = message.Data[i]
        }
		
		const cmd = `canwritestream()`;
			
        await this.serialPort.WriteCommand(cmd);
        const res = await this.serialPort.ReadResponse();
		
		if (!res.success) {
			throw new Exception("CAN write error: " + res.respone);
		}
		
		await this.serialPort.WriteRawData(data, 0, data.length);

		const res2 = await this.serialPort.ReadResponse();

		return res2.success;
	}

    async ReadMessage () {
        const cmd = `canreadstream()`;
			
        await this.serialPort.WriteCommand(cmd);
        const res = await this.serialPort.ReadResponse();
		
		if (!res.success) {
			throw new Exception("CAN read error: " + res.respone);
		}

        let data = new Uint8Array(16);

        await this.serialPort.ReadRawData(data, 0, data.length);

        let id = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3]

        let message = new CanMessage(id, data[4] > 0 ? true : false, data[5] > 0 ? true : false, data, 8, data[6]);

        const res2 = await this.serialPort.ReadResponse();

		if (res2.success)
            return message

        return null


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

		if (pin === 'u' || pin === 'U') {
            pin = 85;
        }

        if (pin === 'd' || pin === 'D') {
            pin = 68;
        }

		if (pin === 'l' || pin === 'L') {
            pin = 76;
        }

        if (pin === 'r' || pin === 'R') {
            pin = 82;
        }

        if (pin < 0 || (pin >= this.serialPort.DeviceConfig.MaxPinIO && pin !== 97 && pin !== 98 && pin !== 108 && pin !== 85 && pin !== 76 && pin !== 68 && pin !== 82)) {
            throw new Error('Invalid pin');
        }

        let pull = '0';
        if (inputType === 1) {
            pull = '1';
        } else if (inputType === 2) {
            pull = '2';
        } else if (inputType === "none" || inputType === "None") {
            pull = '0';
        } else if (inputType === "pullup" || inputType === "PullUp") {
            pull = '1';
        } else if (inputType === "pulldown" || inputType === "PullDown") {
            pull = '1';
        } else {
            throw new Error('Invalid PinType');
        }

        const cmd = `log(dread(${pin},${pull}))`;
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


export class DisplayType {

	static get ILI9342() {
		return 0x80;
	}

	static get ILI9341() {
		return 0x81;
	}

	static get ST7735() {
		return 0x82;
	}

	static get SSD1306() {
		return 0x3C;
	}

	static get BuiltIn() {
		return 0;
	}
}

class DisplayConfiguration {

	constructor(serialPort, display) {
		this.serialPort = serialPort;
		this.display = display;

		this.Type = DisplayType.BuiltIn;

		this.I2cAddress = 0;


		this.SpiChipSelect = 0;
		this.SpiDataControl = 0;
		this.SpiPortrait = false;
		this.SpiFlipScreenHorizontal = false;
		this.SpiFlipScreenVertical = false;
		this.SpiSwapRedBlueColor = false;
		this.SpiSwapByteEndianness = false;
        this.WindowStartX = 0;
        this.WindowStartY = 0;


	}

	async Update() {
        let address = 0
        let config = 0
        let chipselect = 0
        let datacontrol= 0

		address |= (this.Type);


		config |= (this.SpiPortrait == true ? 1 : 0) << 0;
		config |= (this.SpiFlipScreenHorizontal == true ? 1 : 0) << 1;
		config |= (this.SpiFlipScreenVertical == true ? 1 : 0) << 2;
		config |= (this.SpiSwapRedBlueColor == true ? 1 : 0) << 3;
		config |= (this.SpiSwapByteEndianness == true ? 1 : 0) << 4;
        config |= this.WindowStartX << 8;
        config |= this.WindowStartY << 12;

        chipselect = this.SpiChipSelect
		datacontrol= this.SpiDataControl

		if ((this.serialPort.DeviceConfig.IsTick || this.serialPort.DeviceConfig.IsEdge) && this.Type != DisplayType.SSD1306 && this.Type != DisplayType.BuiltIn) {
			throw new Error("The device does not support SPI display");
		}

		switch (this.Type) {
			case DisplayType.SSD1306:
				this.display.Width = 128;
				this.display.Height = 64;

				break;

			case DisplayType.ILI9342:
			case DisplayType.ILI9341:
				this.display.Width = 160;
				this.display.Height = 120;
				break;

			case DisplayType.ST7735:
				this.display.Width = 160;
				this.display.Height = 128;
				break;
            case DisplayType.BuiltIn :
                if (this.serialPort.DeviceConfig.IsTick === false && this.serialPort.DeviceConfig.IsPulse === false && this.serialPort.DeviceConfig.IsRave === false && this.serialPort.DeviceConfig.IsDue === false) {
                    throw new Error("The device does not support BuiltIn display");
                }

                if (this.serialPort.DeviceConfig.IsTick) {
                    this.display.Width = 5;
                    this.display.Height = 5;
                }
                else if (this.serialPort.DeviceConfig.IsPulse) {
                    this.display.Width = 128;
                    this.display.Height = 64;
                }
                else if (this.serialPort.DeviceConfig.IsRave) {
                    this.display.Width = 160;
                    this.display.Height = 120;
                }
                break;

		}


        const cmd = `lcdconfig(${address}, ${config}, ${chipselect}, ${datacontrol})`;

        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();

        return res.success;
	}
}

class DisplayController {
    #_palette;

    constructor(serialPort) {
        this.serialPort = serialPort;
        this.Width = 128;
        this.Height = 64;

        if (this.serialPort.DeviceConfig.IsRave) {
            this.Width = 160;
            this.Height = 120;
        }
        else if (this.serialPort.DeviceConfig.IsRave) {
            this.Width = 5;
            this.Height = 5;
        }

        this.Configuration = new DisplayConfiguration(this.serialPort, this);

        this.#_palette = [
            0x000000, // Black
            0xFFFFFF, // White
            0xFF0000, // Red
            0x32CD32, // Lime
            0x0000FF, // Blue
            0xFFFF00, // Yellow
            0x00FFFF, // Cyan
            0xFF00FF, // Magenta
            0xC0C0C0, // Silver
            0x808080, // Gray
            0x800000, // Maroon
            0xBAB86C, // Oliver
            0x00FF00, // Green
            0xA020F0, // Purple
            0x008080, // Teal
            0x000080, // Navy
        ];
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

    async Palette(id, color) {
        if (id > 16) {
            throw new Error("Palette supports 16 color index only.");
        }

        this.#_palette[id] = color;

        const cmd = `palette(${id},${color})`;

        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();
        return res.success;
    }

    async PaletteFromBuffer(pixels, bucketDepth = 8) {
        let builder = new PaletteBuilder(bucketDepth);
        let palette = builder.BuildPalette(pixels);
        for (let i = 0; i < palette.length; i++) {
            if (!await this.Palette(i, palette[i])) {
                return false;
            }
        }
        return true;
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

    async __Stream(data, color_depth) {
        let cmd = `lcdstream(${color_depth})`;
        await this.serialPort.WriteCommand(cmd);
        let res = await this.serialPort.ReadResponse();

        if (res.success) {
            this.serialPort.WriteRawData(data, 0, data.length);
            res = await this.serialPort.ReadResponse();
        }

        return res.success;
    }

    #ColorDistance(color1, color2)
    {
        let r1 = (color1 >> 16) & 0xff;
        let g1 = (color1 >> 8) & 0xff;
        let b1 = (color1 >> 0) & 0xff;

        let r2 = (color2 >> 16) & 0xff;
        let g2 = (color2 >> 8) & 0xff;
        let b2 = (color2 >> 0) & 0xff;

        let rd = (r1 - r2) * (r1 - r2);
        let gd = (g1 - g2) * (g1 - g2);
        let bd = (b1 - b2) * (b1 - b2);
        return rd+gd+bd;
    }

    #PaletteLookup(color)
    {
        let bestDistance = this.#ColorDistance(this.#_palette[0], color);
        let bestEntry = 0;
        for(let i = 1; i < this.#_palette.length; i++)
        {
            let distance = this.#ColorDistance(this.#_palette[i], color);
            if (distance < bestDistance)
            {
                bestDistance = distance;
                bestEntry = i;
            }
        }
        return bestEntry;
    }

    async ShowBuffer(bitmap, color_depth) {
        if (!bitmap) {
            throw new Error("Bitmap array is null");
        }

		if (this.Configuration.Type == DisplayType.BuiltIn) {
			if (this.serialPort.DeviceConfig.IsPulse && color_depth != 1)
				throw new Error("BuiltIn support one bit only");
		}

        const width = this.Width;
        const height = this.Height;

        let buffer_size = 0;
        let i=0;
        let buffer = null;

        let typeI2c = (this.Configuration.Type < 0x80) && (this.Configuration.Type > 0)

        switch(color_depth) {
            case 1:
                if (typeI2c || (this.Configuration.Type == DisplayType.BuiltIn && (this.serialPort.DeviceConfig.IsPulse || this.serialPort.DeviceConfig.IsDue))) {
					buffer_size = Math.floor(width * height / 8);
					buffer = new Uint8Array(buffer_size);
					for (let y = 0; y < height; y++) {
						for (let x = 0; x < width; x++) {
							let index = (y >> 3) * width + x;

							let red = bitmap[i];
							let green = bitmap[i+1];
							let blue = bitmap[i+2];

							if (red + green + blue > 0) {
								buffer[index] |= 1 << (y & 7);
							}
							else {
								buffer[index] &= ~(1 << (y & 7));
							}

							i += 4; // Move to next pixel
						}
					}
				}
				else {
					buffer_size = Math.floor(width * height / 8);
					buffer = new Uint8Array(buffer_size);

					let data = 0;
					i = 0;
					let bit = 0;
					let j = 0;

					for (let y = 0; y < height; y++) {
						for (let x = 0; x < width; x++) {

							let red = bitmap[i];
							let green = bitmap[i + 1];
							let blue = bitmap[i + 2];
							let clr = ((red << 16) | (green << 8) | blue);

							if (clr != 0) {
								data |= (1 << bit);
							}

							bit +=1

							if (bit == 8) {
								buffer[j] = data;
								j+=1

								bit = 0;
								data = 0;

							}

							i += 4;

						}
					}

				}
                break;
            case 4:
                buffer_size = width * height / 2;
                buffer = new Uint8Array(buffer_size);
                for(let j = 0; j < buffer_size; i += 8, j++) {
                    let red = bitmap[i];
                    let green = bitmap[i+1];
                    let blue = bitmap[i+2];
                    let pixel1 = (red << 16) | (green << 8) | blue;

                    red = bitmap[i+4];
                    green = bitmap[i+4+1];
                    blue = bitmap[i+4+2];
                    let pixel2 = (red << 16) | (green << 8) | blue;

                    buffer[j] = (this.#PaletteLookup(pixel1) << 4) | this.#PaletteLookup(pixel2);
                }
                break;
            case 8:
                buffer_size = width * height;
                buffer = new Uint8Array(buffer_size);
                for(let j = 0; j < buffer_size; i += 4, j++) {
                    let red = bitmap[i];
                    let green = bitmap[i+1];
                    let blue = bitmap[i+2];

                    buffer[j] = ((red >> 5) << 5) | ((green >> 5) << 2) | (blue >> 6);
                }
                break;
            case 16:
                buffer_size = width * height * 2;
                buffer = new Uint8Array(buffer_size);
                for (var y = 0; y < height; y++) {
                    for (var x = 0; x < width; x++) {
                        var index = (y * width + x) * 2;

                        let red = bitmap[i];
                        let green = bitmap[i+1];
                        let blue = bitmap[i+2];
                        let clr = (red << 16) | (green << 8) |  blue

                        buffer[index + 0] = (((clr & 0b0000_0000_0000_0000_0001_1100_0000_0000) >> 5) | ((clr & 0b0000_0000_0000_0000_0000_0000_1111_1000) >> 3)) & 0xff
                        buffer[index + 1] = (((clr & 0b0000_0000_1111_1000_0000_0000_0000_0000) >> 16) | ((clr & 0b0000_0000_0000_0000_1110_0000_0000_0000) >> 13)) & 0xff
                        i += 4;
                    }
                }
                break;
            default:
                throw new Error("Invalid color depth");
        }

        return await this.__Stream(buffer, color_depth);
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

class PaletteBuilder {
    #_bucketSize;

    constructor(bucketsPerChannel) {
        const ValuesPerChannel = 256;

        if (bucketsPerChannel < 1 || bucketsPerChannel > ValuesPerChannel) {
            throw new Error(`Buckets per channel must be between 1 and ${ValuesPerChannel}`);
        }

        this.#_bucketSize = ValuesPerChannel / bucketsPerChannel;
    }

    BuildPalette(pixels) {
        let histogram = {};

        for (let i = 0; i < pixels.length; i += 4) {
            let pixel = (pixels[i+0] << 16) | (pixels[i+1] << 8) | (pixels[i+2] << 0);

            let key = this.#CreateColorKey(pixel);
            if(key in histogram) {
                histogram[key].push(pixel);
            } else {
                histogram[key] = [pixel];
            }
        }

        // sort buckets
        let buckets = Object.values(histogram);
        let sortedBuckets = buckets.sort((a, b) => a.length - b.length).reverse();

        let palette = new Uint32Array(16);
        let i=0;
        for (let i = 0; i < 16; i++) {
            palette[i] = this.#AverageColor(sortedBuckets[i % sortedBuckets.length]);;
        }
        return palette;
      }

    #AverageColor(colors) {
        let r = 0;
        let g = 0;
        let b = 0;
        for(let color of colors) {
            r += ((color >> 16) & 0xff);
            g += ((color >> 8) & 0xff);
            b += ((color >> 0) & 0xff);
        }
        var count = colors.length;
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        return (r & 0xff) << 16 | (g & 0xff) << 8 | b & 0xff;
    }

    #CreateColorKey(color) {
        var redBucket = Math.floor(((color >> 16) & 0xff) / this.#_bucketSize);
        var greenBucket = Math.floor(((color >> 8) & 0xff) / this.#_bucketSize);
        var blueBucket = Math.floor(((color >> 0) & 0xff) / this.#_bucketSize);
        return (redBucket << 16) | (greenBucket << 8) | blueBucket;
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

        const cmd = `log(distance(${pulsePin},${echoPin}))`;
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
        let cmd = `log(humidity(${pin},${sensortype}))`;
        await this.serialPort.WriteCommand(cmd);

        let res = await this.serialPort.ReadResponse();
        return parseFloat(res.response);
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

    async Write(address, data, offset = 0, length = -1) {
        if (length == -1)
            length = data.length

        return await this.WriteRead(address, data, offset, length, null, 0, 0);
    }

    async Read(address, data, offset = 0, length = -1) {
        if (length == -1)
            length = data.length

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
        const cmd = "log(irread())";
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

    async Enable(pin, enable) {
        let en = 0;

        if (enable === true) {
            en = 1;
        }

		if (pin != 2 && pin != 8)
			throw new Error("IR is only available on pin 2 and 8");

        const cmd = `irenable(${pin}, ${en})`;
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
    MAX_LED_NUM = 1024;

    constructor(serialPort) {
        this.serialPort = serialPort;
        this.SupportLedNumMax = this.MAX_LED_NUM;
    }

    async Show(pin, count) {
        const cmd = `neoshow(${pin}, ${count})`;
        await this.serialPort.WriteCommand(cmd);

        // each led need 1.25us delay blocking mode
        const delay = ((this.MAX_LED_NUM * 3 * 8 * 1.25) / 1000000);
        /*setTimeout(async () => {
            const res = await this.serialPort.ReadResponse();
            return res.success;
        }, delay);*/

        await new Promise(resolve => setTimeout(resolve, delay));
        const res = await this.serialPort.ReadResponse();
        return res.success;
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
	
	async SetRGB(id, red, green, blue) {        
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

	__get_button_up() {
        return 85;
    }

	__get_button_down() {
        return 68;
    }

	__get_button_left() {
        return 76;
    }

	__get_button_right() {
        return 82;
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

	get ButtonUp() {
        return this.__get_button_up();
    }

	get ButtonDown() {
        return this.__get_button_down();
    }

	get ButtonLeft() {
        return this.__get_button_left();
    }

	get ButtonRight() {
        return this.__get_button_right();
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

class SoundController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    async Beep(pin, frequency, duration) {
        if (frequency < 0 || frequency > 10000) {
            throw ("Frequency is within range[0,10000] Hz");
        }
        if (duration < 0 || duration > 1000) {
            throw ("duration is within range[0,1000] millisecond");
        }

        if (pin === 'p' || pin === 'P') {
            pin = 112;
        }

        let cmd = `beep(${pin}, ${frequency}, ${duration})`;

        await this.serialPort.WriteCommand(cmd);
        let res = await this.serialPort.ReadResponse();
        return res.success;
    }
}


class SpiController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    async Write(dataWrite, offset = 0, length = -1, chipselect = -1) {
        if (length === -1)
            length = dataWrite.length

        return await this.WriteRead(dataWrite, offset, length, null, 0, 0, chipselect);
    }

    async Read(dataRead, offset = 0, length = -1, chipselect = -1) {
        if (length === -1)
            length = dataRead.length

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

    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    async Reset(option) {
        let cmd = `reset(${option.value === 1 ? 1 : 0})`;
        await this.serialPort.WriteCommand(cmd);
        this.serialPort.Disconnect();
    }

    async GetTickMicroseconds() {
        let cmd = "log(tickus())";
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
        let cmd = "log(tickms())";
        await this.serialPort.WriteCommand(cmd);
        let res = await this.serialPort.ReadResponse();
        if (res.success) {
            try {
                return parseInt(res.response);
            } catch { }
        }
        return -1;
    }

   

    async #PrnText(text, newline) {
        let cmd = `print("${text}")`;

		if (newline)
			cmd = `println("${text}")`;

		await this.serialPort.WriteCommand(cmd);
        let res = await this.serialPort.ReadResponse();
    }

    async Print(text) {
        if (typeof text === "string") {
			console.log(text);
            await this.#PrnText(text, false);
        } else if (typeof text === "boolean") {
            console.log(text ? "1" : "0");
			await this.#PrnText(text ? "1" : "0", false);
        } else {
			console.log(text.toString());
            await this.#PrnText(text.toString(), false);
        }

        return true;
    }

    async Println(text) {
        if (typeof text === "string") {
		   console.log(text);
           await this.#PrnText(text, true);
        } else if (typeof text === "boolean") {
		   console.log(text ? "1" : "0");
           await this.#PrnText(text ? "1" : "0", true);
        } else {
		   console.log(text.toString());
           await this.#PrnText(text.toString(), true);
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
        let cmd = `log(temp(${pin},${sensortype}))`;
        await this.serialPort.WriteCommand(cmd);

        let res = await this.serialPort.ReadResponse();
        return parseFloat(res.response);
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
        const cmd = `log(touchread(${pin}))`;
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
        let cmd = "x=uartcount():log(x)";
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
        let cmd = "x=uartread():log(x)";
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

class PulseController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    async Set(pin, stepCount,delay ) {
        if (pin < 0 || pin >= this.serialPort.DeviceConfig.MaxPinIO) {
            console.log('Invalid pin');
            //throw new ValueError('Invalid pin');
            return false;
        }
        

        const cmd = `pulse(${pin}, ${stepCount}, ${delay})`;
        await this.serialPort.WriteCommand(cmd);

        const response = await this.serialPort.ReadResponse();

        return response.success;
    }
}

class DUELinkController {
    constructor(serial) {
        this.serialPort = new SerialInterface(serial);

        this.IsPulse = false;
        this.IsFlea = false;
        this.IsPico = false;
        this.IsEdge = false;
        this.IsRave = false;
		this.IsTick = false;
		this.IsDue = false;
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
        this.System = new SystemController(this.serialPort);
		
		this.Pulse = new PulseController(this.serialPort);		
		this.Can = new CanController(this.serialPort);
        this.Sound = new SoundController(this.serialPort);
        this.Bluetooth = new BluetoothController(this.serialPort);     

    }

    async Connect() {
        await this.serialPort.Connect();

        this.Version = (await this.serialPort.GetVersion());
        this.Version = this.Version.split("\n")[0];
        this.Version = this.Version.replace("\r", "");
        if (this.Version === "" || this.Version.length !== 7) {
            throw ("The device is not supported: ${this.Version}");
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
            this.DeviceConfig.IsEdge = true;
            this.DeviceConfig.MaxPinIO = 22;
            this.DeviceConfig.MaxPinAnalog = 11;
        } else if (this.Version[this.Version.length - 1] === "R") {
            this.DeviceConfig.IsRave = true;
            this.DeviceConfig.MaxPinIO = 23;
            this.DeviceConfig.MaxPinAnalog = 29;
        } else if (this.Version[this.Version.length - 1] === "T") {
            this.DeviceConfig.IsTick = true;
            this.DeviceConfig.MaxPinIO = 23;
            this.DeviceConfig.MaxPinAnalog = 11;
		} else if (this.Version[this.Version.length - 1] === "D") {
            this.DeviceConfig.IsDue = true;
            this.DeviceConfig.MaxPinIO = 15;
            this.DeviceConfig.MaxPinAnalog = 10;
        
        } else {
            throw new Error("The device is not supported. ${this.Version}");
        }

        this.IsPulse = this.DeviceConfig.IsPulse;
        this.IsFlea = this.DeviceConfig.IsFlea;
        this.IsPico = this.DeviceConfig.IsPico;
        this.IsEdge = this.DeviceConfig.IsEdge;
        this.IsRave = this.DeviceConfig.IsRave;
		this.IsTick = this.DeviceConfig.IsTick;
		this.IsDue = this.DeviceConfig.IsDue;

        this.serialPort.DeviceConfig = this.DeviceConfig;
        await this.InitDevice();
    }

    async Disconnect() {
        await this.serialPort.Disconnect();
    }
}