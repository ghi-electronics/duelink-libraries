export { SerialInterface, DUELinkController, Util }
import { Util } from "../util.js";

class SerialInterface {
    isReady = false;
    isBrowser = false;
    static CommandCompleteText = ">";
    static Decoder = new TextDecoder();    

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
        cmd[0] = 0x7f;
    
        await this.WriteRawData(cmd, 0, 1);
		
		await Util.sleep(300);
	
		this.portName.resetInputBuffer();
		this.portName.resetOutputBuffer();
		
		await this.TurnEchoOff();

		this.leftOver = "";
		this.portName.resetInputBuffer();
		this.portName.resetOutputBuffer();
    }

    async TurnEchoOff() {
        if (!this.echo) {
            return;
        }
        await this.WriteCommand("echo(0)");
        await this.ReadResponse();
        this.echo = false;
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
            const data = await this.portName.readbyte();
			
            if (data) 
			{

                

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

            
        }
		
		this.leftOver = "";

		this.portName.resetInputBuffer();
		this.portName.resetOutputBuffer();
			
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
        this.MaxPinIO = 27;
        this.PWMPins = new Set([1, 2, 3, 4, 5, 6, 7, 8, 11]);
        this.AnalogPins = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 17, 23]);
        this.InterruptPins = new Set([1, 2, 3, 4, 5, 6, 7, 12]);
    }
}

class AnalogController {
    constructor(serialPort) {
        this.serialPort = serialPort;
    }

    async VRead(pin) {  
        if (!this.serialPort.DeviceConfig.AnalogPins.has(pin))
        {
          throw new Error("Invalid pin");
        }
    
        const cmd = `vread(${pin})`;
    
        await this.serialPort.WriteCommand(cmd);
    
        const res = await this.serialPort.ReadResponse();
    
        if (res.success) {
          try {
            return parseFloat(res.response);
          } catch {}
        }
    
        return -1;
      }
    
      async PWrite(pin, dc) {
        if (!this.serialPort.DeviceConfig.AnalogPins.has(pin)) {
          throw new Error("Invalid pin");
        }
    
        if (dc < 0 || dc > 1) {
          throw new Error("Duty cycle must be in the range 0.0 ... 1.0");
        }
    
        const cmd = `pwrite(${pin}, ${dc})`;
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
      if (
        typeof pin !== "number" ||
        pin < 0 ||
        (pin >= this.serialPort.DeviceConfig.MaxPinIO)
      ) {
        throw new Error("Invalid pin");
      }
  
      const cmd = `btnen(${pin}, ${Number(enable)})`;
  
      await this.serialPort.WriteCommand(cmd);
      const res = await this.serialPort.ReadResponse();
  
      return res.success;
    }
  
    async Down(pin) {
      if (
        typeof pin !== "number" ||
        pin < 0 ||
        (pin >= this.serialPort.DeviceConfig.MaxPinIO)
      ) {
        throw new Error("Invalid pin");
      }
      const cmd = `btndown(${pin})`;
  
      await this.serialPort.WriteCommand(cmd);
      const res = await this.serialPort.ReadResponse();
  
      if (res.success) {
        try {
          return parseInt(res.response) === 1;
        } catch {
          console.log("Press EXCEPTION");
        }
      }
  
      return false;
    }
  
    async Up(pin) {
  
      if (
        typeof pin !== "number" ||
        pin < 0 ||
        (pin >= this.serialPort.DeviceConfig.MaxPinIO)
      ) {
        throw new Error("Invalid pin");
      }
  
      const cmd = `btnup(${pin})`;
  
      await this.serialPort.WriteCommand(cmd);
      const res = await this.serialPort.ReadResponse();
  
      if (res.success) {
        try {
          return parseInt(res.response) === 1;
        } catch {}
      }
  
      return false;
    }
}


class DigitalController {
    constructor(serialPort) {
      this.serialPort = serialPort;
    }
  
    async Read(pin, pull = 0) {
      if (
        typeof pin !== "number" ||
        pin < 0 ||
        (pin >= this.serialPort.DeviceConfig.MaxPinIO)
      ) {
        throw new Error("Invalid pin");
      }
  
      if (typeof pull !== "number" || ![0, 1, 2].includes(pull)) {
        throw new Error("Invalid pull inputType. Please enter an integer 0-2");
      }
  
      const cmd = `dread(${pin},${pull})`;
      await this.serialPort.WriteCommand(cmd);
  
      const response = await this.serialPort.ReadResponse();
  
      if (response.success) {
        try {
          const value = parseInt(response.response);
          return value === 1;
        } catch {}
      }
  
      return false;
    }
  
    async Write(pin, value) {
     if (
        typeof pin !== "number" ||
        pin < 0 ||
        (pin >= this.serialPort.DeviceConfig.MaxPinIO)
      ) {
        throw new Error("Invalid pin");
      }
  
      const cmd = `dwrite(${pin},${value ? 1 : 0})`;
      this.serialPort.WriteCommand(cmd);
      const response = await this.serialPort.ReadResponse();
      return response.success;
    }
  }


export class GraphicsType {
    static get I2c() {
      return 1;
    }
  
    static get Spi() {
      return 2;
    }
  
    static get Neo() {
      return 3;
    }
  
    static get Matrix5x5() {
      return 4;
    }
}


class GraphicsController {
 
    constructor(serialPort) {
      this.serialPort = serialPort;    
    }
  
    async Configuration(type, config, width, height, mode) {
      let cfg_array = "{";
  
      for (let i = 0; i < config.length; i++) {
        cfg_array += config[i];
    
        if (i < config.length - 1)
          cfg_array += ",";
      }
  
      cfg_array += "}";
  
  
      let cmd = `gfxcfg(${type},${cfg_array},${width},${height},${mode})`;
  
      await this.serialPort.WriteCommand(cmd);
      let res = await this.serialPort.ReadResponse();
      return res.success;
    }
  
    async Show() {
      let cmd = "show()";
      await this.serialPort.WriteCommand(cmd);
      let res = await this.serialPort.ReadResponse();
      return res.success;
    }
  
    async Clear(color) {
      let cmd = `clear(${color})`;
      await this.serialPort.WriteCommand(cmd);
      let res = await this.serialPort.ReadResponse();
      return res.success;
    }
    
  
    async Pixel(color, x, y) {
      let cmd = `pixel(${color},${x},${y})`;
      await this.serialPort.WriteCommand(cmd);
      let res = await this.serialPort.ReadResponse();
      return res.success;
    }
  
    async Circle(color, x, y, radius) {
      let cmd = `circle(${color},${x},${y},${radius})`;
      await this.serialPort.WriteCommand(cmd);
      let res = await this.serialPort.ReadResponse();
      return res.success;
    }
  
    async Rect(color, x, y, width, height) {
      let cmd = `rect(${color},${x},${y},${width},${height})`;
      await this.serialPort.WriteCommand(cmd);
      let res = await this.serialPort.ReadResponse();
      return res.success;
    }
  
    async Fill(color, x, y, width, height) {
      let cmd = `fill(${color},${x},${y},${width},${height})`;
      await this.serialPort.WriteCommand(cmd);
  
      let res = await this.serialPort.ReadResponse();
      return res.success;
    }
  
    async Line(color, x1, y1, x2, y2) {
      let cmd = `line(${color},${x1},${y1},${x2},${y2})`;
      await this.serialPort.WriteCommand(cmd);
  
      let res = await this.serialPort.ReadResponse();
      return res.success;
    }
  
    async Text(text, color, x, y) {
      let cmd = `text("${text}",${color},${x},${y})`;
      await this.serialPort.WriteCommand(cmd);
      let res = await this.serialPort.ReadResponse();
      return res.success;
    }
  
    async TextS(text, color, x, y, scalewidth, scaleheight) {
      let cmd = `texts("${text}",${color},${x},${y},${scalewidth},${scaleheight})`;
      await this.serialPort.WriteCommand(cmd);
  
      let res = await this.serialPort.ReadResponse();
      return res.success;
    }
  
    async TextT(text, color, x, y) {
      let cmd = `textt("${text}",${color},${x},${y})`;
      await this.serialPort.WriteCommand(cmd);
  
      let res = await this.serialPort.ReadResponse();
      return res.success;
    }
    
    async DrawImageScale(img, x, y, width, height, scaleWidth, scaleHeight, transform) {
      if (!img || !width || !height) throw new Error("Invalid argument.");
      
      let img_array = "[";
  
      for (let i = 0; i < width * height; i++) {
        img_array += img[i];
    
        if (i < countWrite - 1)
          img_array += ",";
      }
  
      img_array += "]";
      
      cmd = `imgs(${img_array}, ${x}, ${y}, ${width}, ${height},${scaleWidth}, ${scaleHeight}, ${transform})`;
  
      await this.serialPort.WriteCommand(cmd);
  
      res = await this.serialPort.ReadResponse();
      
      return res.success;
    }
  
    async DrawImage(img, x, y, w, h, transform) {
      return await this.DrawImageScale(img, x, y, w, h, 1, 1, transform);
    }
    
}


class DistanceSensorController {
    constructor(serialPort) {
      this.serialPort = serialPort;
    }
  
    async Read(pulsePin, echoPin) {
      if (
        typeof pulsePin !== "number" ||
        pulsePin < 0 ||
        (pulsePin >= this.serialPort.DeviceConfig.MaxPinIO)
      ) {
        throw new Error("Invalid pin");
      }
  
      if (
        typeof echoPin !== "number" ||
        echoPin < 0 ||
        (echoPin >= this.serialPort.DeviceConfig.MaxPinIO)
      ) {
        throw new Error("Invalid pin");
      } 
  
      const cmd = `dist(${pulsePin},${echoPin})`;
      await this.serialPort.WriteCommand(cmd);
  
      const res = await this.serialPort.ReadResponse();
  
      if (res.success) {
        try {
          const distance = parseFloat(res.response);
          return distance;
        } catch (error) {
  
        }
      }
  
      return -1;
    }
}

class FrequencyController {
    constructor(serialPort) {
      this.serialPort = serialPort;
      this.MaxFrequency = 10000000;
      this.MinFrequency = 15;
    }
  
    async Write(pin, frequency, duration_ms = 0, dc = 0.5) {
      if (
        typeof pin !== "number" ||
        pin < 0 ||
        (pin >= this.serialPort.DeviceConfig.MaxPinIO)
      ) {
        throw new Error("Invalid pin");
      }
  
      if (frequency < this.MinFrequency || frequency > this.MaxFrequency) {
        throw new Error("Frequency must be in range 15Hz...10000000Hz");
      }
     
  
      if (dc < 0 || dc > 1) {
        throw new Error("dutycyle must be in range 0.0...1.0");
      }
  
  
      let cmd = `freq(${pin}, ${frequency}, ${duration_ms}, ${dc})`;
      await this.serialPort.WriteCommand(cmd);
  
      let res = await this.serialPort.ReadResponse();
  
      return res.success;
    }
  }
  
  class HumidityController {
    constructor(serialPort) {
      this.serialPort = serialPort;
    }
  
    async Read(pin, sensortype) {
      if (
        typeof pin !== "number" ||
        pin < 0 ||
        (pin >= this.serialPort.DeviceConfig.MaxPinIO)
      ) {
        throw new Error("Invalid pin");
      }
  
      let cmd = `humid(${pin},${sensortype})`;
      await this.serialPort.WriteCommand(cmd);
  
      let res = await this.serialPort.ReadResponse();
      return parseFloat(res.response);
    }
  }

  class I2cController {
    constructor(serialPort) {
      this.serialPort = serialPort;
    }
  
    async Write(address, data, offset = 0, length = -1) {
      if (length == -1) length = data.length;
  
      return await this.WriteRead(address, data, offset, length, null, 0, 0);
    }
  
    async Read(address, data, offset = 0, length = -1) {
      if (length == -1) length = data.length;
  
      return await this.WriteRead(address, null, 0, 0, data, offset, length);
    }
  
    async WriteRead(
      address,
      dataWrite,
      offsetWrite,
      countWrite,
      dataRead,
      offsetRead,
      countRead
    ) {
      if (
        (dataWrite === null && dataRead === null) ||
        (countWrite === 0 && countRead === 0)
      ) {
        throw new Error(
          "At least one of dataWrite or dataRead must be specified"
        );
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
  
      let write_array = "[";
  
      for (let i = 0; i < countWrite; i++) {
        write_array += dataWrite[i];
    
        if (i < countWrite - 1)
            write_array += ",";
      }
  
      write_array += "]";
  
      // I2C write only
      const cmd = `i2cwr(${address},${write_array},0)`;
      await this.serialPort.WriteCommand(cmd);    
  
      const res = await this.serialPort.ReadResponse();
      return res.success;
    }
}

class InfraredController {
    constructor(serialPort) {
      this.serialPort = serialPort;
    }
  
    async Read() {
      const cmd = "irread()";
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
      if (pin != 0)
        throw new Error("IR is only available on pin 0");
  
      const cmd = `iren(${pin}, ${Number(enable)})`;
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

class EngineController {
    constructor(serialPort) {
      this.serialPort = serialPort;
  
    }
  
    async Record(script) {
  
      await this.serialPort.WriteCommand("new");
  
      const response_new = await this.serialPort.ReadResponse();
  
      if (response_new.success) {      
  
        const cmd = "pgmstream()";
  
        const raw = new TextEncoder().encode(script);
  
        const data = new Uint8Array(raw.length + 1);
  
        data[raw.length] = 0; // stop the stream
  
        data.set(raw, 0);
  
        await this.serialPort.WriteCommand(cmd);
  
        const res = await this.serialPort.ReadResponse();
  
        if (res.success === false) {
          return false;
        }
  
        this.serialPort.WriteRawData(data, 0, data.length);
  
        const res2 = await this.serialPort.ReadResponse();
  
        return res2.success;
      }
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
}
  

// Assuming SerialInterface and ValueError classes are already imported

class ServoController {
    constructor(serialPort) {
      this.serialPort = serialPort;
    }
  
    async Set(pin, position) {
      if (!this.serialPort.DeviceConfig.PWMPins.has(pin))
      {
        throw new Error("Invalid pin");
      }
  
      if (position < 0 || position > 180) {
        throw new ValueError('Position must be in the range 0..180');            
      }
  
      const cmd = `servost(${pin}, ${position})`;
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
      if (
        typeof pin !== "number" ||
        pin < 0 ||
        (pin >= this.serialPort.DeviceConfig.MaxPinIO)
      ) {
        throw new Error("Invalid pin");
      }
  
      if (
        !Number.isInteger(pin) ||
        !Number.isInteger(frequency) ||
        !Number.isInteger(duration)
      ) {
        throw new Error(
          "Please enter integers for pin, frequency, and duration."
        );
      }
  
      let cmd = `beep(${pin}, ${frequency}, ${duration})`;
  
      await this.serialPort.WriteCommand(cmd);
      let res = await this.serialPort.ReadResponse();
      return res.success;
    }
  
    async MelodyPlay(pin, notes) {
      if (
        !Array.isArray(notes) ||
        !notes.every((item) => Number.isInteger(item))
      ) {
        throw new Error("Please enter an array of integers as notes.");
      }
  
      if (
        !Number.isInteger(pin) ||
        pin < 0 ||
        !this.DeviceConfig.PWMPins.has(pin)
      ) {
        throw new Error("Please enter a valid PWM pin as an integer.");
      }
  
      cmd = `melodyp(${pin}, ${notes})`;
      await this.serialPort.WriteCommand(cmd);
      let res = await this.serialPort.ReadResponse();
      return res.success;
    }
  
    async MelodyStop(pin) {
      if (
        !Number.isInteger(pin) ||
        pin < 0 ||
        !this.DeviceConfig.PWMPins.has(pin)
      ) {
        throw new Error("Please enter a valid PWM pin as an integer.");
      }
  
      cmd = `MelodyS(${pin})`;
  
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
      if (length === -1) length = dataWrite.length;
  
      return await this.WriteRead(
        dataWrite,
        offset,
        length,
        null,
        0,
        0,
        chipselect
      );
    }
  
    async Read(dataRead, offset = 0, length = -1, chipselect = -1) {
      if (length === -1) length = dataRead.length;
  
      return await this.WriteRead(
        null,
        0,
        0,
        dataRead,
        offset,
        length,
        chipselect
      );
    }
  
    async WriteRead(
      dataWrite,
      offsetWrite,
      countWrite,
      dataRead,
      offsetRead,
      countRead
    ) {
  
      if (
        (dataWrite === null && dataRead === null) ||
        (countWrite === 0 && countRead === 0)
      ) {
        throw new Error("Invalid arguments");
      }
  
      if (dataWrite !== null && offsetWrite + countWrite > dataWrite.length) {
        throw new Error("Invalid arguments");
      }
  
      if (dataRead !== null && offsetRead + countRead > dataRead.length) {
        throw new Error("Invalid arguments");
      }
  
      let write_array = "[";
  
      for (let i = 0; i < countWrite; i++) {
        write_array += dataWrite[i];
    
        if (i < countWrite - 1)
            write_array += ",";
      }
  
      write_array += "]";
  
      // SPI write only
      const cmd = `spiwrs(${write_array},0)`;
      await this.serialPort.WriteCommand(cmd);    
  
      const res = await this.serialPort.ReadResponse();
      return res.success;
    }
  
    async WriteByte(data) {   
  
      const cmd = `spiwr(${data})`;
  
      await this.serialPort.WriteCommand(cmd);
  
      const res = await this.serialPort.ReadResponse();
      if (res.success) {
        try {
          const value = parseInt(res.response);
          return value;
        } catch {
  
        }
      }
  
      return -1;
    }
  
    async Configuration(mode, frequencyKHz) {
      if (mode > 3 || mode < 0) {
        throw new Error("Mode must be in range 0...3.");
      }
  
      if (frequencyKHz < 200 || frequencyKHz > 24000) {
        throw new Error("FrequencyKHz must be in range 200KHz to 24MHz.");
      }
  
      const cmd = `spicfg(${mode},${frequencyKHz})`;
  
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
      let cmd = `reset(${option.value})`;
      await this.serialPort.WriteCommand(cmd);
      this.serialPort.Disconnect();
    }
  
    async GetTickMicroseconds() {
      let cmd = "tickus()";
      await this.serialPort.WriteCommand(cmd);
      let res = await this.serialPort.ReadResponse();
      if (res.success) {
        try {
          return parseInt(res.response);
        } catch {}
      }
      return -1;
    }
  
    async GetTickMilliseconds() {
      let cmd = "tickms()";
      await this.serialPort.WriteCommand(cmd);
      let res = await this.serialPort.ReadResponse();
      if (res.success) {
        try {
          return parseInt(res.response);
        } catch {}
      }
      return -1;
    }
  
    async Info(code) {
      const cmd = `info(${code})`;
      await this.serialPort.WriteCommand(cmd);
      let res = await this.serialPort.ReadResponse();
      if (res.success) {
        try {
          return parseInt(res.response);
        } catch {}
      }
      return -1;
  
    }
  
}

class TemperatureController {
    constructor(serialPort) {
      this.serialPort = serialPort;
    }
  
    async Read(pin, sensortype) {
      if (
        typeof pin !== "number" ||
        pin < 0 ||
        (pin >= this.serialPort.DeviceConfig.MaxPinIO)
      ) {
        throw new Error("Invalid pin");
      }
  
      let cmd = `temp(${pin},${sensortype})`;
      await this.serialPort.WriteCommand(cmd);
  
      let res = await this.serialPort.ReadResponse();
      return parseFloat(res.response);
    }
  }
  
  class TouchController {
    constructor(serialPort) {
      this.serialPort = serialPort;
    }
  
    async Touch(pin, charge_t, charge_s, timeout) {
      const cmd = `touch(${pin}, ${charge_t}, ${charge_s}, ${timeout})`;
      await this.serialPort.WriteCommand(cmd);
  
      const res = await this.serialPort.ReadResponse();
      let val = false;
      if (res.success) {
        try {
          val = parseInt(res.response) === 1;
          return val;
        } catch {}
      }
      return val;
    }
}

class UartController {
    constructor(serialPort) {
      this.serialPort = serialPort;
    }
  
    // async Enable(baudrate) {
    //   let cmd = `uartinit(${baudrate})`;
    //   await this.serialPort.WriteCommand(cmd);
    //   let res = await this.serialPort.ReadResponse();
    //   return res.success;
    // }
  
    // async Write(data) {
    //   let cmd = `uartwrite(${data})`;
    //   await this.serialPort.WriteCommand(cmd);
    //   let res = await this.serialPort.ReadResponse();
    //   return res.success;
    // }
  
    // async BytesToRead() {
    //   let cmd = "uartcount()";
    //   await this.serialPort.WriteCommand(cmd);
    //   let res = await this.serialPort.ReadResponse();
    //   if (res.success) {
    //     try {
    //       let ready = parseInt(res.response);
    //       return ready;
    //     } catch {}
    //   }
    //   throw "BytesToRead error!";
    // }
  
    // async Read() {
    //   let cmd = "uartread()";
    //   await this.serialPort.WriteCommand(cmd);
    //   let res = await this.serialPort.ReadResponse();
    //   if (res.success) {
    //     try {
    //       let data = parseInt(res.response);
    //       return data;
    //     } catch {}
    //   }
    //   throw "Uart receving error!";
    // }
}

class DUELinkController {
    constructor(serial) {
      this.serialPort = new SerialInterface(serial);
    }
  
    async InitDevice() {
      if (!this.serialPort) {
        throw `Not connected to the device.`;
      }
  
      this.Analog = new AnalogController(this.serialPort);
      this.Digital = new DigitalController(this.serialPort);
      this.I2c = new I2cController(this.serialPort);
      this.Servo = new ServoController(this.serialPort);
      this.Frequency = new FrequencyController(this.serialPort);
      this.Spi = new SpiController(this.serialPort);
      this.Infrared = new InfraredController(this.serialPort);
      this.Uart = new UartController(this.serialPort);
      this.Button = new ButtonController(this.serialPort);
      this.Distance = new DistanceSensorController(this.serialPort);
      this.Graphics = new GraphicsController(this.serialPort);
      this.Touch = new TouchController(this.serialPort);
      this.Led = new LedController(this.serialPort);
      this.Engine = new EngineController(this.serialPort);
      this.Temperature = new TemperatureController(this.serialPort);
      this.Humidity = new HumidityController(this.serialPort);
      this.System = new SystemController(this.serialPort);
  

      this.Sound = new SoundController(this.serialPort);
  
  
    }
  
    async Connect() {
      await this.serialPort.Connect();
  
      this.DeviceConfig = new DeviceConfiguration();
  
      
  
      this.serialPort.DeviceConfig = this.DeviceConfig;
      await this.InitDevice();
    }
  
    async Disconnect() {
      await this.serialPort.Disconnect();
    }
}