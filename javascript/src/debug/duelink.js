export { SerialInterface, DUELinkController, Util }
import { Util } from "./util.js";

class SerialInterface {
    isReady = false;
    isBrowser = false;
    static CommandCompleteText = ">";
    static Decoder = new TextDecoder();    

    constructor(serial) {
        this.DeviceConfig = null;
        this.portName = serial;
        this.leftOver = "";
        this.ReadTimeout = 3000;
        this.echo = true;
        this.isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";
        this.EnabledAsio = true
        
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
      // Synchronize is no longer  send 127 because the device can be host which is runing a loop to control its clients.
      // We jusr send \n as first commands for chain enumeration
      cmd[0] = 10; 

      await this.WriteRawData(cmd, 0, 1);

      await Util.sleep(300);

      this.portName.resetInputBuffer();
      this.portName.resetOutputBuffer();

      //await this.TurnEchoOff();

      //this.leftOver = "";
      //this.portName.resetInputBuffer();
      //this.portName.resetOutputBuffer();
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

        const cmd_lowcase = command.toLowerCase();

        if (cmd_lowcase.indexOf("print") == 0
            || cmd_lowcase.indexOf("dim") == 0
            || cmd_lowcase.indexOf("run") == 0
            || cmd_lowcase.indexOf("list") == 0
            || cmd_lowcase.indexOf("new") == 0
            || cmd_lowcase.indexOf("echo") == 0
            || cmd_lowcase.indexOf("sel") == 0
            || cmd_lowcase.indexOf("version") == 0
            || cmd_lowcase.indexOf("region") == 0
            || cmd_lowcase.indexOf("alias") == 0
            || cmd_lowcase.indexOf("sprintf") == 0
            ) {
            await this.__WriteLine(command);
        }
        else if (this.EnabledAsio) {
          const newCmd = `println(${command})`;
          await this.__WriteLine(newCmd);
        }
        else {
          await this.__WriteLine(command);
        }
    }

    async __WriteLine(string) {
        string += "\n";
        await this.portName.sendString(string);
    }

    async ReadChar() {      
      const data = await this.portName.readbyte()
      return SerialInterface.Decoder.decode(data)[0];
    }

    async ReadByte() {
      const data = await this.portName.readbyte()
      return data[0];

    }

    async Available() {      
      if (!this.portName.hasData())
        await Util.pumpAsync();
      
      return this.portName.hasData();
    }

    async ReadResponse() {
      let str = "";
      let total_receviced = 0;
      let dump = 0;
      let responseValid = true;
      const response = new Cmdresponse();
      let end = new Date(Date.now() + this.ReadTimeout);


      while (!this.portName.hasData() && new Date() <= end) {
          await Util.pumpAsync();
      }
      if (!this.portName.hasData()) {
          console.log("No Response");
      }

      while (new Date() <= end || this.portName.hasData()) {
          if (this.portName.hasData()) {
            const data = await this.portName.readbyte();
            str += SerialInterface.Decoder.decode(data);
            total_receviced++;
            
            if (SerialInterface.Decoder.decode(data)[0] == '\n') { //'\n'
              if (!this.portName.hasData()) {
                await Util.sleep(1);
              }

              // next byte can be >, &, !, $
              if (this.portName.hasData()) {
                await Util.sleep(1);                  
                dump = SerialInterface.Decoder.decode(await this.portName.readbyte())[0];
                if (dump == '>' || dump == '!' || dump == '$') {
                    // valid data 
                    await Util.sleep(1); // wait 1ms for sure next byte

                    if (this.portName.hasData()) {
                      responseValid = false; // still data, this is bad response, there is no \r\n>xxxx
                    }
                }
                else if (dump == '\r') {
                  // there is case 0\r\n\r\n> if use println("btnup(0)") example, this is valid
                  if (!this.portName.hasData()) {
                    await Util.sleep(1); // wait 1ms for sure next byte   
                  }

                  if (this.portName.hasData()) {
                    dump = SerialInterface.Decoder.decode(await this.portName.readbyte())[0];

                    if (dump == '\n') {
                        if (this.portName.hasData()) 
                            dump = SerialInterface.Decoder.decode(await this.portName.readbyte())[0];
                    }
                    else {
                        responseValid = false;
                    }
                  }
                  else {
                      responseValid = false;
                  }
                } 
                else {
                    responseValid = false;
                }

                
              }
              // once bad response \r\nxxx... or \r\n>xxxx, mean next \r\n is comming, wait timeout to clear them to clean the bus if possible        
              if (!responseValid) {
                dump = 0;
                while (dump != '\n' && new Date() <= end) {
                  if (this.portName.hasData()) {
                    dump = SerialInterface.Decoder.decode(await this.portName.readbyte())[0];
                  }
                  else
                  {
                    await Util.sleep(1); // wait 1ms for sure next byte   
                  }

                  if (dump == '\n') {
                    if (this.portName.hasData()) // // still bad data, repeat clean up
                    {
                      dump = 0; // reset to repeat the condition while loop
                    }
                  }
                
                }
              }
              
              // reponse valid has to be xxx\r\n or \r\n, or xxx\r\n> or \r\n> mean idx >=2
              if (str == "" || str.length < 2 ) {
                if (str[str.length - 2] != '\r') {
                  responseValid = false;
                }
              }
              else {
                // valid response, remove \r\n
                str = str.slice(0, str.length -2);
              }
              

              break;

            }

            end = new Date(Date.now() + this.ReadTimeout);
          }            
      }		      
      this.portName.resetInputBuffer();
      this.portName.resetOutputBuffer();

      //debugger;
      response.success = response.success = total_receviced > 1 && responseValid;
      response.response = str;

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
        this.PWMPins = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 11]);
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
        if (!this.serialPort.DeviceConfig.PWMPins.has(pin)) {
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
  
    async Enable(pin, enable, pull) {
      if (
        typeof pin !== "number" ||
        pin < 0 
      ) {
        throw new Error("Invalid pin");
      }
  
       const cmd = `btnen(${pin}, ${Number(enable)},${pull})`;
  
      await this.serialPort.WriteCommand(cmd);
      const res = await this.serialPort.ReadResponse();
  
      return res.success;
    }
  
    async Down(pin) {
      if (
        typeof pin !== "number" ||
        pin < 0 
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
        pin < 0 
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

class EngineController {
    constructor(serialPort) {
      this.serialPort = serialPort;
  
    }
  
    async Run(script) {
      const data = new TextEncoder().encode(script + "\n");

      this.serialPort.DiscardInBuffer();
      this.serialPort.DiscardOutBuffer();

      await this.serialPort.WriteRawData(data, 0, data.length);      
  
      const ret = await this.serialPort.ReadResponse();
  
      return ret.response;
    }

    async Select(num) {
      const cmd = `sel(${num})`;
      await this.serialPort.WriteCommand(cmd);

      const ret = await this.serialPort.ReadResponse();
      return ret.response;
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
			if (code == 0) {
				return parseInt(res.response);
			}
			else {
				return parseFloat(res.response);
			}
        } catch {}
      }
      return -1;
  
    }
    
    async StatLed(highPeriod, lowPeriod, count) {
      const cmd = `statled(${highPeriod},${lowPeriod},${count})`;
      await this.serialPort.WriteCommand(cmd);
  
      const res = await this.serialPort.ReadResponse();
      return res.success;
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

class StreamController {
  constructor(serialPort) {
    this.serialPort = serialPort;
  }

  async WriteSpi(data) {
    if (data === null||data.length==0)
      return 0
    const count = data.length
    const cmd = `strmspi(${count})`;

    await this.serialPort.WriteCommand(cmd);  
    await this.serialPort.ReadResponse();

    while (!this.serialPort.hasData()) {
      await Util.sleep(1)
    }

    const prompt = await this.serialPort.ReadChar();

    if (prompt != '&') {
        throw new Error("Wrong response package");          
    }

    // ready write data
    await this.serialPort.WriteRawData(data, 0, data.Length);

    // read x\r\n> (asio(1) not return this)
    const ret = await this.serialPort.ReadResponse();    
    
    if (ret.success) {
      try {
        const written = parseInt(ret.response);
        return written;
      } catch {

      }
    }
    return 0;
  }
  
  async WriteBytes(array_name, data) {
    if (data === null||data.length==0)
      return 0

    const count = data.length
    const cmd = `strmwr(${array_name},${count})`;

    await this.serialPort.WriteCommand(cmd);  
    
    // wait for prompt & 
    while (!await this.serialPort.Available()) {
      await Util.sleep(1)
    }

    const prompt = await this.serialPort.ReadChar();

    if (prompt != '&') {
        throw new Error("Wrong response package");          
    }

    // ready write data
    await this.serialPort.WriteRawData(data, 0, data.length);

    // read x\r\n> (asio(1) not return this)
    const ret = await this.serialPort.ReadResponse();    
    
    if (ret.success) {
      try {
        const written = parseInt(ret.response);
        return written;
      } catch {

      }
    }
    return 0;
  }

  async WriteFloats(array_name, data) {
    if (data === null||data.length==0)
      return 0

    const count = data.length
    const cmd = `strmwr(${array_name},${count})`;

    await this.serialPort.WriteCommand(cmd);  
    
    // wait for prompt & 
    while (!await this.serialPort.Available()) {
      await Util.sleep(1)
    }

    const prompt = await this.serialPort.ReadChar();

    if (prompt != '&') {
        throw new Error("Wrong response package");          
    }

    // convert float to byte array
    for (let i = 0; i < count; i++) {
      const floatArray = new Float32Array(1);
      floatArray[0] = data[i];
      const byteArray = new Int8Array(floatArray.buffer);

      const float2bytes = Array.from(byteArray);

      // ready write data
      await this.serialPort.WriteRawData(float2bytes, 0, float2bytes.length);

    }

    // ready write data
    //await this.serialPort.WriteRawData(data, 0, data.length);

    // read x\r\n> (asio(1) not return this)
    const ret = await this.serialPort.ReadResponse();    
    
    if (ret.success) {
      try {
        const written = parseInt(ret.response);
        return written;
      } catch {

      }
    }
    return 0;
  }

  async ReadBytes(array_name, data) {
    if (data === null||data.length==0)
      return 0

    const count = data.length
    const cmd = `strmrd(${array_name},${count})`;

    await this.serialPort.WriteCommand(cmd);  
    // wait for prompt &

    while (!await this.serialPort.Available()) {
      await Util.sleep(1)
    }

    const prompt = await this.serialPort.ReadChar();

    if (prompt != '&') {
        throw new Error("Wrong response package");          
    }

    // ready write data
    await this.serialPort.ReadRawData(data, 0, data.length);

    // read x\r\n> (asio(1) not return this)
    const ret = await this.serialPort.ReadResponse();    
    
    if (ret.success) {
      try {
        const read = parseInt(ret.response);
        return read;
      } catch {

      }
    }
    return 0;
  }

  async ReadFloats(array_name, data) {
    if (data === null||data.length==0)
      return 0

    const count = data.length
    const cmd = `strmrd(${array_name},${count})`;

    await this.serialPort.WriteCommand(cmd);  
    // wait for prompt &

    while (!await this.serialPort.Available()) {
      await Util.sleep(1)
    }

    const prompt = await this.serialPort.ReadChar();

    if (prompt != '&') {
        throw new Error("Wrong response package");          
    }

    // ready write data
    let data_bytes_x4 = new Uint8Array(data.length * 4);

    await this.serialPort.ReadRawData(data_bytes_x4, 0, data_bytes_x4.length);

    for (let i = 0; i < data.length; i++) {
      const buffer = new ArrayBuffer(4);
      const bytes = new Uint8Array(buffer);
      bytes[0] = data_bytes_x4[i*4 + 3]; 
      bytes[1] = data_bytes_x4[i*4 + 2]; 
      bytes[2] = data_bytes_x4[i*4 + 1]; 
      bytes[3] = data_bytes_x4[i*4 + 0]; 

      const view = new DataView(buffer);
      data[i] = view.getFloat32(0, false);

    }

    // read x\r\n> (asio(1) not return this)
    const ret = await this.serialPort.ReadResponse();    
    
    if (ret.success) {
      try {
        const read = parseInt(ret.response);
        return read;
      } catch {

      }
    }
    return 0;
  }
}


class DUELinkController {
    constructor(serial) {
      this.serialPort = new SerialInterface(serial);
    }

    get ReadTimeout() {
      return this.serialPort.ReadTimeout;
    }

    set ReadTimeout(value) {
      this.serialPort.ReadTimeout = value;
    }

    get EnabledAsio() {
      return this.serialPort.EnabledAsio;
    }

    set EnabledAsio(value) {
      this.serialPort.EnabledAsio = value;
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
      this.Engine = new EngineController(this.serialPort);
      this.Temperature = new TemperatureController(this.serialPort);
      this.Humidity = new HumidityController(this.serialPort);
      this.System = new SystemController(this.serialPort);
  

      this.Sound = new SoundController(this.serialPort);
      this.Stream = new StreamController(this.serialPort);
  
  
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