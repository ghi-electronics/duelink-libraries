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
        this.ReadTimeout = 3000;
        this.echo = true;
        this.isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";                
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
      
      await this.WriteCommand("sel(1)");
      
      await Util.sleep(100);

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

        // const cmd_lowcase = command.toLowerCase();

        // if (cmd_lowcase.indexOf("print") == 0
            // || cmd_lowcase.indexOf("dim") == 0
            // || cmd_lowcase.indexOf("run") == 0
            // || cmd_lowcase.indexOf("list") == 0
            // || cmd_lowcase.indexOf("new") == 0
            // || cmd_lowcase.indexOf("echo") == 0
            // || cmd_lowcase.indexOf("sel") == 0
            // || cmd_lowcase.indexOf("version") == 0
            // || cmd_lowcase.indexOf("region") == 0
            // || cmd_lowcase.indexOf("alias") == 0
            // || cmd_lowcase.indexOf("sprintf") == 0
            // ) {
            // await this.__WriteLine(command);
        // }
        // else if (this.EnabledAsio) {
          // const newCmd = `println(${command})`;
          // await this.__WriteLine(newCmd);
        // }
        // else {
          // await this.__WriteLine(command);
        // }
        await this.__WriteLine(command);
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
      let response = new Cmdresponse();
      let end = new Date(Date.now() + this.ReadTimeout);


      while (!this.portName.hasData() && new Date() <= end) {
          await Util.pumpAsync();
      }
      if (!this.portName.hasData()) {
          console.log("No Response");
      }

      await Util.sleep(1); // As tested, hasData return true even there is no data yet, this return Available > 0 only but data is not in buffer
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

    async ReadResponseRaw() {
      let str = "";
      let total_receviced = 0;     
      let end = new Date(Date.now() + this.ReadTimeout);
      let response = new Cmdresponse();

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

          end = new Date(Date.now() + this.ReadTimeout); // reset timeout
        }
      }

      response.response = ""
      response.success = false;

      if (total_receviced > 3) {
        response.success = true;
        response.response = str.slice(0,total_receviced-3 );        
      }
    
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

    async VoltRead(pin) {  
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
    
    async Read(pin) {  
        if (!this.serialPort.DeviceConfig.AnalogPins.has(pin))
        {
          throw new Error("Invalid pin");
        }

        const cmd = `aread(${pin})`;

        await this.serialPort.WriteCommand(cmd);

        const res = await this.serialPort.ReadResponse();

        if (res.success) {
          try {
            return parseFloat(res.response);
          } catch {}
        }

        return -1;
    }
    
    async Write(pin, dc) {
        if (!this.serialPort.DeviceConfig.PWMPins.has(pin)) {
          throw new Error("Invalid pin");
        }
    
        if (dc < 0 || dc > 1) {
          throw new Error("Duty cycle must be in the range 0.0 ... 1.0");
        }
    
        const cmd = `awrite(${pin}, ${dc})`;
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
  
    async Enable(pin, state) {
      if (
        typeof pin !== "number" ||
        pin < 0 
      ) {
        throw new Error("Invalid pin");
      }
  
       const cmd = `btnen(${pin}, ${state})`;
  
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
    
    async Read(pin) {
  
      if (
        typeof pin !== "number" ||
        pin < 0 
      ) {
        throw new Error("Invalid pin");
      }
  
      const cmd = `btnread(${pin})`;
  
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
 
    constructor(serialPort, stream) {
      this.serialPort = serialPort
      this.stream = stream
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
    
    async DrawImageScale(img, x, y, width, height, transform, scaleWidth, scaleHeight) {
      if (!img || !width || !height) throw new Error("Invalid argument.");
      
      let countWrite = img.length

      let cmd = `dim a9[${countWrite}]`
      await this.serialPort.WriteCommand(cmd);
      await this.serialPort.ReadResponse();

      await this.stream.WriteFloats("a9", img);
      
      
      cmd = `imgs(a9, ${x}, ${y}, ${width}, ${height}, ${transform},${scaleWidth}, ${scaleHeight})`;
  
      await this.serialPort.WriteCommand(cmd);
  
      const res = await this.serialPort.ReadResponse();
      
      return res.success;
    }
  
    async DrawImage(img, x, y, w, h, transform) {
      return await this.DrawImageScale(img, x, y, w, h, transform, 1, 1);
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
      this.MaxFrequency = 24000000;
      this.MinFrequency = 15;
    }
  
    async Write(pin, frequency, duration_ms = 0, dc = 0.5) {
      if (
        typeof pin !== "number" || pin < 0 
      ) {
        throw new Error("Invalid pin");
      }
  
      if (frequency < this.MinFrequency || frequency > this.MaxFrequency) {
        throw new Error("Frequency must be in range 15Hz...24000000Hz");
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
        pin < 0 
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
    constructor(serialPort, stream) {
      this.serialPort = serialPort
      this.stream = stream
    }
      
    async Configuartion(speed) {
      const cmd = `i2ccfg(${speed})`;

      await this.serialPort.WriteCommand(cmd);
  
      let res = await this.serialPort.ReadResponse();
      return res.success;
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
  
      //let write_array = "[";
  
      //for (let i = 0; i < countWrite; i++) {
      //  write_array += dataWrite[i];
    
      //  if (i < countWrite - 1)
      //      write_array += ",";
      //}
  
     // write_array += "]";

    let cmd = ""
    let written = 0;
    let read = 0; 

    if (countWrite > 0) {
        // declare b9 to write
        cmd = `dim b9[${countWrite}]`;
        this.serialPort.WriteCommand(cmd);
        this.serialPort.ReadResponse();
    }

    if (countRead > 0) {
        // declare b9 to write
        cmd = `dim b8[${countRead}]`;
        this.serialPort.WriteCommand(cmd);
        this.serialPort.ReadResponse();
    }

    if (countWrite > 0) {
      // write data to b9 by stream      
      let write_array = dataWrite.slice(offsetWrite, offsetWrite + countWrite-1);      
      written = this.stream.WriteBytes("b9", write_array);
    }

    // issue i2cwr cmd
    if (countWrite > 0 && countRead > 0) {
      cmd = `i2cwr(${address},b9,b8)`;
    }
    else if (countWrite > 0) {
       cmd = `i2cwr(${address},b9,0)`;
    }
    else {
      cmd = `i2cwr(${address},0, b8)`;
    }

    this.serialPort.WriteCommand(cmd);
    this.serialPort.ReadResponse();

    if (countRead > 0) {
      // use stream to read data to b8
      let read_array = dataRead.slice(offsetRead, offsetRead + countRead-1);  
      read = this.stream.ReadBytes("b8", read_array); 
      
      for (let i = 0; i < countRead; i++) {
        dataRead[offsetRead + i] = read_array[i]
      }
    }

    return (written == countWrite) && (read == countRead);
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

    async Write(data) {
      const cmd = `IrWrite(${data})`;
      await this.serialPort.WriteCommand(cmd);
      const res = await this.serialPort.ReadResponse();
      return res.success
    }
  
    async Enable(txpin, rxpin) {          
      const cmd = `iren(${txpin},${rxpin}})`;
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
  
    async Run() {
      await this.serialPort.WriteCommand("run");    
  
      const ret = await this.serialPort.ReadResponse();
  
      return ret.response;
    }

    async Stop() {
      this.serialPort.DiscardInBuffer();
      this.serialPort.DiscardOutBuffer();

      const data = new Uint8Array(1);
      data[0] = 27
      await this.serialPort.WriteRawData(data, 0, 1);   
      
      const ret = await this.serialPort.ReadResponse();
  
      return ret.response;
    }

    async Select(num) {
      const cmd = `sel(${num})`;
      await this.serialPort.WriteCommand(cmd);

      const ret = await this.serialPort.ReadResponse();
      return ret.response;
    }

    async Record(script,region) {
      if (region == 0) {
        await this.serialPort.WriteCommand("new all");
        const ret = await this.serialPort.ReadResponse();

        if (ret.success == false)
          return false;
      }
      else if (region == 1) {
        await this.serialPort.WriteCommand("Region(1)");
        const ret = await this.serialPort.ReadResponse();

        if (ret.success == false)
          return false;

        await this.serialPort.WriteCommand("new");
        ret = await this.serialPort.ReadResponse();

        if (ret.success == false)
          return false;
      }
      else {
        return false;
      }
      
        
  
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
    
    async Read() {
      const cmd = "list";
  
      await this.serialPort.WriteCommand(cmd);
      const res = await this.serialPort.ReadResponse();
  
      return res.response;
    }
    
    async WriteCommand(cmd) {
      await this.serialPort.WriteCommand(cmd);
      const res = await this.serialPort.ReadResponseRaw();
  
      return res.response;
    }
    
    async Cmd(s) {
        return await this.WriteCommand(`cmd(${s})`);
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
      constructor(serialPort, stream) {
      this.serialPort = serialPort
      this.stream = stream
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
      //if (
      //  !Array.isArray(notes) ||
      //  !notes.every((item) => Number.isInteger(item))
      //) {
      //  throw new Error("Please enter an array of integers as notes.");
      //}
  
      //if (
      //  !Number.isInteger(pin) ||
      //  pin < 0 ||
      //  !this.DeviceConfig.PWMPins.has(pin)
      //) {
      //  throw new Error("Please enter a valid PWM pin as an integer.");
      //}
  
      count = notes.length

      // declare a9 array
      let cmd = `dim a9[${count}]`;
      await this.serialPort.WriteCommand(cmd);  
      await this.serialPort.ReadResponse();

      // write data to a9
      const written = await this.stream.WriteFloats("a9",notes)

      // play a9
      cmd = `melodyp(${pin}, a9)`
      await this.serialPort.WriteCommand(cmd); 
      const ret = await this.serialPort.ReadResponse();
      
      return ret.success;      
    }
  
    async MelodyStop(pin) {
      //if (
      //  !Number.isInteger(pin) ||
      //  pin < 0 ||
      //  !this.DeviceConfig.PWMPins.has(pin)
      //) {
      //  throw new Error("Please enter a valid PWM pin as an integer.");
      //}
  
      cmd = `MelodyS(${pin})`;
  
      await this.serialPort.WriteCommand(cmd);
      let res = await this.serialPort.ReadResponse();
      return res.success;
    
    }
}


class SpiController {
    constructor(serialPort, stream) {
      this.serialPort = serialPort
      this.stream = stream
    }
  
    //async Write(dataWrite, offset = 0, length = -1, chipselect = -1) {
    //  if (length === -1) length = dataWrite.length;
    //
    //  return await this.WriteRead(
    //    dataWrite,
    //    offset,
    //    length,
    //    null,
    //    0,
    //    0,
    //    chipselect
    //  );
    //}
  
    //async Read(dataRead, offset = 0, length = -1, chipselect = -1) {
    //  if (length === -1) length = dataRead.length;
  
    //  return await this.WriteRead(
    //    null,
    //    0,
    //    0,
    //    dataRead,
    //    offset,
    //    length,
    //    chipselect
    //  );
    //}
  
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
  
      //let write_array = "[";
  
      //for (let i = 0; i < countWrite; i++) {
      //  write_array += dataWrite[i];
    
      //  if (i < countWrite - 1)
      //      write_array += ",";
      //}
  
      //write_array += "]";
      let cmd = ""
      let written = 0;
      let read = 0; 

      if (countWrite > 0) {
          // declare b9 to write
          cmd = `dim b9[${countWrite}]`;
          this.serialPort.WriteCommand(cmd);
          this.serialPort.ReadResponse();
      }

      if (countRead > 0) {
          // declare b9 to write
          cmd = `dim b8[${countRead}]`;
          this.serialPort.WriteCommand(cmd);
          this.serialPort.ReadResponse();
      }

      if (countWrite > 0) {
        // write data to b9 by stream      
        let write_array = dataWrite.slice(offsetWrite, offsetWrite + countWrite-1);      
        written = this.stream.WriteBytes("b9", write_array);
      }

      // issue i2cwr cmd
      if (countWrite > 0 && countRead > 0) {
        cmd = `spiwrs(b9,b8)`;
      }
      else if (countWrite > 0) {
        cmd = `spiwrs(b9,0)`;
      }
      else {
        cmd = `spiwrs(0, b8)`;
      }

      // issue SPI writeread     
      await this.serialPort.WriteCommand(cmd);
      this.serialPort.ReadResponse();    
  
      if (countRead > 0) {
        // use stream to read data to b8
        let read_array = dataRead.slice(offsetRead, offsetRead + countRead-1);  
        read = this.stream.ReadBytes("b8", read_array); 
        
        for (let i = 0; i < countRead; i++) {
          dataRead[offsetRead + i] = read_array[i]
        }
      }

      return (written == countWrite) && (read == countRead);
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

      // Erase all send reset twice
      if (option == 1) {
        await this.serialPort.ReadResponse();
        await this.serialPort.WriteCommand(cmd);
      }

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
			if (code != 1 ) { // 1 is firmware is float
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

    async Shutdown(wkpin) {
      const cmd = `shtdn(${wkpin})`;
      await this.serialPort.WriteCommand(cmd);
      
      // does system response?
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
  
    async Read(pin, charge_t, charge_s, timeout) {
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
    constructor(serialPort, stream) {
      this.serialPort = serialPort
      this.stream = stream
    }
  
    async Configuration(baudrate, rx_buffer_size) {
      let cmd = `SerCfg(${baudrate},${rx_buffer_size})`;
      await this.serialPort.WriteCommand(cmd);
      let res = await this.serialPort.ReadResponse();
      return res.success;
    }
  
    async WriteByte(data) {
      let cmd = `SerWr(${data})`;
      await this.serialPort.WriteCommand(cmd);
      let res = await this.serialPort.ReadResponse();
      return res.success;
    }

    async WriteBytes(data) {
      const count = data.length
      // declare b9 array
      const cmd = `dim b9[${count}]`;
      await this.serialPort.WriteCommand(cmd);  
      await this.serialPort.ReadResponse();  

      // write data to b9
      const written = await this.stream.WriteBytes("b9",data)

      // write b9 out
      await this.serialPort.WriteCommand("SerWrs(b9)"); 
      
      const ret = await this.serialPort.ReadResponse();    
          
      return written == count;
    }

    async ReadByte() {
      
      await this.serialPort.WriteCommand(`SerRd()`);
      const res = await this.serialPort.ReadResponse();
      let val = 0;
      if (res.success) {
        try {
          val = parseInt(res.response);
          return val;
        } catch {}
      }
      return val;
    }

    async ReadBytes(data, timeout) {
      const count = data.length
      // declare b9 array
      let cmd = `dim b9[${count}]`;
      await this.serialPort.WriteCommand(cmd);  
      await this.serialPort.ReadResponse();

      cmd = `SerRds(b9,${timeout})`;
      await this.serialPort.WriteCommand(cmd); 
      await this.serialPort.ReadResponse();

      const ret = this.stream.ReadBytes("b9", data)

      return ret
    
    }

    async BytesToRead() {
      
      await this.serialPort.WriteCommand(`SerB2R()`);
      const res = await this.serialPort.ReadResponse();
      let val = 0;
      if (res.success) {
        try {
          val = parseInt(res.response);
          return val;
        } catch {}
      }
      return val;
    }

    async Discard() {      
      await this.serialPort.WriteCommand(`SerDisc()`);
      const ret = await this.serialPort.ReadResponse();
      return ret.success
    }
  
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

class CoProcessorController {
  constructor(serialPort, stream) {
    this.serialPort = serialPort
    this.stream = stream
  }

  async Erase() {
    await this.serialPort.WriteCommand("CoprocE()");  
    const ret = await this.serialPort.ReadResponse();  

    return ret.success;
  }

  async Program() {
    throw new Error("Not implemented");
  }

  async Reset() {
    await this.serialPort.WriteCommand("CoprocS()");  
    const ret = await this.serialPort.ReadResponse();  

    return ret.success;
  }

  async Version() {
    await this.serialPort.WriteCommand("CoprocV()");  
    const ret = await this.serialPort.ReadResponse();  

    return ret.success;
  }

  async Write(data) {
    const count = data.length
    // declare b9 array
    const cmd = `dim b9[${count}]`;
    await this.serialPort.WriteCommand(cmd);  
    await this.serialPort.ReadResponse();  

    // write data to b9
    const written = await this.stream.WriteBytes("b9",data)

    // write b9 to co-pro
    await this.serialPort.WriteCommand("CoprocW(b9)"); 
    
    const ret = await this.serialPort.ReadResponse();    
        
    return written == count;
  }

  async Read(data) {
    const count = data.length
    // declare b9 array
    const cmd = `dim b9[${count}]`;
    await this.serialPort.WriteCommand(cmd);  
    await this.serialPort.ReadResponse();      

    // read data to b9
    await this.serialPort.WriteCommand("CoprocR(b9)");     
    await this.serialPort.ReadResponse();  
    
    // read b9 by stream
    const read = await this.stream.ReadBytes("b9",data)
        
    return read == count;
  }
}

class DMXController {
  constructor(serialPort, stream) {
    this.serialPort = serialPort
    this.stream = stream
  }

  async Write(data) {
    const count = data.length

    // declare b9 array
    const cmd = `dim b9[${count}]`;
    await this.serialPort.WriteCommand(cmd);  
    await this.serialPort.ReadResponse();

    // write data to b9
    const written = await this.stream.WriteBytes("b9",data)

     // write b9 to dmx
    await this.serialPort.WriteCommand("DmxW(b9)"); 
    
    const ret = await this.serialPort.ReadResponse();  
    
    return ret.success
  }

  async Read(channel) {        
    const cmd = `DmxR(${channel})`;
    await this.serialPort.WriteCommand(cmd);      
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

  async Ready() {            
    await this.serialPort.WriteCommand("DmxRdy()");      
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

  async Update() {            
    await this.serialPort.WriteCommand("DmxU()");      
    const ret = await this.serialPort.ReadResponse();  
    
    return ret.success;
  }
}

class FileSystemController {
  constructor(serialPort, stream) {
    this.serialPort = serialPort
    this.stream = stream
  }

  async ParseReturn() {
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

  async Mount(type, cs, baud, max_handle) {
    const cmd = `FsMnt(${type},${cs},${baud},${max_handle})`;

    await this.serialPort.WriteCommand(cmd); 

    return await this.ParseReturn();
  }

  async UnMount() {
    await this.serialPort.WriteCommand("FsUnMnt()"); 

    return await this.ParseReturn();
  }

  async Format(type, cs, baud) {
    const cmd = `FsFmt(${type},${cs},${baud})`;

    await this.serialPort.WriteCommand(cmd); 

    return await this.ParseReturn();
  }

  async Open(path, mode) {
    const cmd = `FsOpen("${path}",${mode})`;

    await this.serialPort.WriteCommand(cmd); 

    return await this.ParseReturn();
  }

  async Close(handle) {
    const cmd = `FsClose(${handle})`;

    await this.serialPort.WriteCommand(cmd); 

    return await this.ParseReturn();
  }

  async Write(handle, data) {
    const count = data.length

    // declare b9 array
    const cmd = `dim b9[${count}]`;
    await this.serialPort.WriteCommand(cmd);  
    await this.serialPort.ReadResponse();

    // write data to b9
    const written = await this.stream.WriteBytes("b9",data)

    // write b9 to file
    await this.serialPort.WriteCommand(`FsWrite(${handle}, b9)`); 
    
    return await this.ParseReturn();
  }

  async Read(handle, data) {
    const count = data.length

    // declare b9 array
    const cmd = `dim b9[${count}]`;
    await this.serialPort.WriteCommand(cmd);  
    await this.serialPort.ReadResponse();

    await this.serialPort.WriteCommand(`FsRead(${handle}, b9)`); 
    await this.serialPort.ReadResponse();

    const ret = await this.stream.ReadBytes("b9",data)

    return ret

  }

  async Sync(handle) {
    const cmd = `FsSync(${handle})`;

    await this.serialPort.WriteCommand(cmd); 

    return await this.ParseReturn();
  }

  async Seek(handle, offset) {
    const cmd = `FsSeek(${handle}, ${offset})`;

    await this.serialPort.WriteCommand(cmd); 

    return await this.ParseReturn();
  }

  async Tell(handle) {
    const cmd = `FsTell(${handle})`;

    await this.serialPort.WriteCommand(cmd); 

    return await this.ParseReturn();
  }

  async Delete(path) {
    const cmd = `FsDel("${path}")`;

    await this.serialPort.WriteCommand(cmd); 

    return await this.ParseReturn();
  }

  async Find(path) {
    const cmd = `FsFind("${path}")`;

    await this.serialPort.WriteCommand(cmd); 

    return await this.ParseReturn();
  }

  async Size(path) {
    const cmd = `fsfsz("${path}")`;

    await this.serialPort.WriteCommand(cmd); 

    return await this.ParseReturn();
  }
}

class OtpController {
  constructor(serialPort, stream) {
    this.serialPort = serialPort
    this.stream = stream
  }

  async Write(address, data) {
    const count = data.length

    // declare b9 array
    let cmd = `dim b9[${count}]`;
    await this.serialPort.WriteCommand(cmd);  
    await this.serialPort.ReadResponse();

    // write data to b9
    const written = await this.stream.WriteBytes("b9",data)

    // write b9 to otp
    await this.serialPort.WriteCommand(`OtpW(${address},b9)`); 
    const ret = await this.serialPort.ReadResponse();
    
    return ret.success;
  }

  async Read(address) {
    const cmd = `OtpR(${address})`;
    await this.serialPort.WriteCommand(cmd);  
     
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

class PulseController {
  constructor(serialPort) {
    this.serialPort = serialPort    
  }

  async Read(pin, state, timeout) {
    const cmd = `PulseIn(${pin},${state},${timeout})`;
    await this.serialPort.WriteCommand(cmd);  

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

class RtcController {
  constructor(serialPort, stream) {
    this.serialPort = serialPort
    this.stream = stream
  }

  async Write(rtc_timedate) {
    count = rtc_timedate.length

    // declare b9 array
    let cmd = `dim b9[${count}]`;
    await this.serialPort.WriteCommand(cmd);  
    await this.serialPort.ReadResponse();

    // write data to b9
    const written = await this.stream.WriteBytes("b9",rtc_timedate)

    // write b9 to otp
    await this.serialPort.WriteCommand(`RtcW(b9)`); 
    const ret = await this.serialPort.ReadResponse();
    
    return ret.success;
  }

  async Read(rtc_timedate) {
    // declare b9 array
    let cmd = `dim b9[${count}]`;
    await this.serialPort.WriteCommand(cmd);  
    await this.serialPort.ReadResponse();

    await this.serialPort.WriteCommand(`RtcR(b9)`); 
    await this.serialPort.ReadResponse();

    const ret = this.stream.ReadBytes("b9", rtc_timedate)

    return ret
    
  }

  async Show() {    

    await this.serialPort.WriteCommand("OtpR(0)"); 

    const ret = await this.serialPort.ReadResponse();

     return ret.success
  }
}

class DownlinkController {
  constructor(serialPort) {
    this.serialPort = serialPort
  }

  async SetMode(mode) {    
    let cmd = `dlmode(${mode})`;
    await this.serialPort.WriteCommand(cmd);  
    const ret = await this.serialPort.ReadResponse();   
    
    if (ret.success) {
      try {
        const value = parseInt(ret.response);
        return value === 1;
      } catch {}
    }
    return ret.success;
  }

  async Command(s) {    
    let cmd = `cmd("${s}")`;
    await this.serialPort.WriteCommand(cmd);  
    const ret = await this.serialPort.ReadResponse();   
    
    if (ret.success) {
      try {
        const value = parseFloat(ret.response);
        return value;
      } catch {}
    }
    return 0;
  }

  async SetTimeout(timeout) {    
    let cmd = `cmdtmot(${timeout})`;
    await this.serialPort.WriteCommand(cmd);  
    const ret = await this.serialPort.ReadResponse();   
    
    if (ret.success) {
      try {
        const value = parseInt(ret.response);
        return value === 1;
      } catch {}
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
  
    async InitDevice() {
      if (!this.serialPort) {
        throw `Not connected to the device.`;
      }
  
      this.Stream = new StreamController(this.serialPort);
      this.System = new SystemController(this.serialPort);
      this.Analog = new AnalogController(this.serialPort);
      this.Digital = new DigitalController(this.serialPort);      
      this.Servo = new ServoController(this.serialPort);
      this.Frequency = new FrequencyController(this.serialPort);
      
      this.Infrared = new InfraredController(this.serialPort);
      this.Uart = new UartController(this.serialPort);
      this.Button = new ButtonController(this.serialPort);
      this.Distance = new DistanceSensorController(this.serialPort);      
      this.Touch = new TouchController(this.serialPort);
      this.Engine = new EngineController(this.serialPort);
      this.Temperature = new TemperatureController(this.serialPort);
      this.Humidity = new HumidityController(this.serialPort);
      this.Pulse = new PulseController(this.serialPort);
      this.Downlink = new DownlinkController(this.serialPort);

      this.Sound = new SoundController(this.serialPort, this.Stream);
      this.Spi = new SpiController(this.serialPort,this.Stream, this.Stream);
      this.CoProcessor = new CoProcessorController(this.serialPort, this.Stream);
      this.DMX = new DMXController(this.serialPort, this.Stream);
      this.FileSystem = new FileSystemController(this.serialPort, this.Stream);
      this.I2c = new I2cController(this.serialPort, this.Stream);
      this.Otp = new OtpController(this.serialPort, this.Stream);
      this.Rtc = new RtcController(this.serialPort, this.Stream);
      this.Graphics = new GraphicsController(this.serialPort,this.Stream);
      

  
  
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