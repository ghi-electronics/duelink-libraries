export { SerialInterface, DUELinkController };
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
    this.ReadTimeout = 3;
    this.echo = true;
    this.isBrowser =
      typeof window !== "undefined" && typeof window.document !== "undefined";
  }

  async Connect() {
    if (this.isBrowser) {
      await this.portName.connect([{ usbVendorId: 0x1b9f }]);
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
    } catch {}
    this.port = null;
  }

  async Synchronize() {
    const cmd = new Uint8Array(1);
    cmd[0] = 0x7f;

    await this.WriteRawData(cmd, 0, 1);

    const orig = this.portName.getTimeout();
    this.portName.setTimeout(1);
    let tryCount = 3;
    while (tryCount > 0) {
      this.leftOver = "";
      this.portName.resetInputBuffer();
      this.portName.resetOutputBuffer();
      try {
        let cmd = "version()";

        await this.WriteCommand(cmd);
        let res = await this.ReadResponse();

        if (res.success) {
          if (res.response && res.response.includes(cmd)) {
            await this.TurnEchoOff()
          }

          if (res.response && res.response.includes("GHI Electronics")) {
            break;          
          }

        }

        
      } catch {}
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
          if (data[i] != 10 && data[i] != 13) {
            size = size + 1;
          }
        }

        if (size == 0) {
          continue;
        }

        let newData = new Uint8Array(size);
        let indexArray = 0;

        for (let i = 0; i < data.length; i++) {
          if (data[i] != 10 && data[i] != 13) {
            newData[indexArray] = data[i];
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
      await this.portName.write(
        buffer.slice(idx, idx + SerialInterface.TransferBlockSizeMax)
      );
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
      throw new Error(
        `LeftOver size is different zero: ${this.leftOver.length}`
      );
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
    this.response = "";
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
        return parseInt(res.response);
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
    return 0x3c;
  }

  static get BuiltIn() {
    return 0;
  }
}

// class DisplayConfiguration {
//   constructor(serialPort, display) {
//     this.serialPort = serialPort;
//     this.display = display;

//     this.Type = DisplayType.BuiltIn;

//     this.I2cAddress = 0;

//     this.SpiChipSelect = 0;
//     this.SpiDataControl = 0;
//     this.SpiPortrait = false;
//     this.SpiFlipScreenHorizontal = false;
//     this.SpiFlipScreenVertical = false;
//     this.SpiSwapRedBlueColor = false;
//     this.SpiSwapByteEndianness = false;
//     this.WindowStartX = 0;
//     this.WindowStartY = 0;
//   }

//   async Update() {
//     let address = 0;
//     let config = 0;
//     let chipselect = 0;
//     let datacontrol = 0;

//     address |= this.Type;

//     config |= (this.SpiPortrait == true ? 1 : 0) << 0;
//     config |= (this.SpiFlipScreenHorizontal == true ? 1 : 0) << 1;
//     config |= (this.SpiFlipScreenVertical == true ? 1 : 0) << 2;
//     config |= (this.SpiSwapRedBlueColor == true ? 1 : 0) << 3;
//     config |= (this.SpiSwapByteEndianness == true ? 1 : 0) << 4;
//     config |= this.WindowStartX << 8;
//     config |= this.WindowStartY << 12;

//     chipselect = this.SpiChipSelect;
//     datacontrol = this.SpiDataControl;

//     if (
//       (this.serialPort.DeviceConfig.IsTick ||
//         this.serialPort.DeviceConfig.IsEdge) &&
//       this.Type != DisplayType.SSD1306 &&
//       this.Type != DisplayType.BuiltIn
//     ) {
//       throw new Error("The device does not support SPI display");
//     }

//     switch (this.Type) {
//       case DisplayType.SSD1306:
//         this.display.Width = 128;
//         this.display.Height = 64;

//         break;

//       case DisplayType.ILI9342:
//       case DisplayType.ILI9341:
//         this.display.Width = 160;
//         this.display.Height = 120;
//         break;

//       case DisplayType.ST7735:
//         this.display.Width = 160;
//         this.display.Height = 128;
//         break;
//       case DisplayType.BuiltIn:
//         if (
//           this.serialPort.DeviceConfig.IsTick === false &&
//           this.serialPort.DeviceConfig.IsPulse === false &&
//           this.serialPort.DeviceConfig.IsRave === false &&
//           this.serialPort.DeviceConfig.IsDue === false
//         ) {
//           throw new Error("The device does not support BuiltIn display");
//         }

//         if (this.serialPort.DeviceConfig.IsTick) {
//           this.display.Width = 5;
//           this.display.Height = 5;
//         } else if (this.serialPort.DeviceConfig.IsPulse) {
//           this.display.Width = 128;
//           this.display.Height = 64;
//         } else if (this.serialPort.DeviceConfig.IsRave) {
//           this.display.Width = 160;
//           this.display.Height = 120;
//         }
//         break;
//     }

//     const cmd = `lcdconfig(${address}, ${config}, ${chipselect}, ${datacontrol})`;

//     await this.serialPort.WriteCommand(cmd);

//     const res = await this.serialPort.ReadResponse();

//     return res.success;
//   }
// }

class DisplayController {
  #_palette;

  constructor(serialPort) {
    this.serialPort = serialPort;
    this.Width = 128;
    this.Height = 64;

    if (this.serialPort.DeviceConfig.IsRave) {
      this.Width = 160;
      this.Height = 120;
    } else if (this.serialPort.DeviceConfig.IsRave) {
      this.Width = 5;
      this.Height = 5;
    }

    // this.Configuration = new DisplayConfiguration(this.serialPort, this);

    this.#_palette = [
      0x000000, // Black
      0xffffff, // White
      0xff0000, // Red
      0x32cd32, // Lime
      0x0000ff, // Blue
      0xffff00, // Yellow
      0x00ffff, // Cyan
      0xff00ff, // Magenta
      0xc0c0c0, // Silver
      0x808080, // Gray
      0x800000, // Maroon
      0xbab86c, // Oliver
      0x00ff00, // Green
      0xa020f0, // Purple
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
      if (!(await this.Palette(i, palette[i]))) {
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
    await this.serialPort.WriteCommand(cmd);
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

  async DrawTextTiny(text, color, x, y) {
    let cmd = `lcdtextt("${text}",${color},${x},${y})`;
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

  #ColorDistance(color1, color2) {
    let r1 = (color1 >> 16) & 0xff;
    let g1 = (color1 >> 8) & 0xff;
    let b1 = (color1 >> 0) & 0xff;

    let r2 = (color2 >> 16) & 0xff;
    let g2 = (color2 >> 8) & 0xff;
    let b2 = (color2 >> 0) & 0xff;

    let rd = (r1 - r2) * (r1 - r2);
    let gd = (g1 - g2) * (g1 - g2);
    let bd = (b1 - b2) * (b1 - b2);
    return rd + gd + bd;
  }

  #PaletteLookup(color) {
    let bestDistance = this.#ColorDistance(this.#_palette[0], color);
    let bestEntry = 0;
    for (let i = 1; i < this.#_palette.length; i++) {
      let distance = this.#ColorDistance(this.#_palette[i], color);
      if (distance < bestDistance) {
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
    let i = 0;
    let buffer = null;

    let typeI2c = this.Configuration.Type < 0x80 && this.Configuration.Type > 0;

    switch (color_depth) {
      case 1:
        if (
          typeI2c ||
          (this.Configuration.Type == DisplayType.BuiltIn &&
            (this.serialPort.DeviceConfig.IsPulse ||
              this.serialPort.DeviceConfig.IsDue))
        ) {
          buffer_size = Math.floor((width * height) / 8);
          buffer = new Uint8Array(buffer_size);
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              let index = (y >> 3) * width + x;

              let red = bitmap[i];
              let green = bitmap[i + 1];
              let blue = bitmap[i + 2];

              if (red + green + blue > 0) {
                buffer[index] |= 1 << (y & 7);
              } else {
                buffer[index] &= ~(1 << (y & 7));
              }

              i += 4; // Move to next pixel
            }
          }
        } else {
          buffer_size = Math.floor((width * height) / 8);
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
              let clr = (red << 16) | (green << 8) | blue;

              if (clr != 0) {
                data |= 1 << bit;
              }

              bit += 1;

              if (bit == 8) {
                buffer[j] = data;
                j += 1;

                bit = 0;
                data = 0;
              }

              i += 4;
            }
          }
        }
        break;
      case 4:
        buffer_size = (width * height) / 2;
        buffer = new Uint8Array(buffer_size);
        for (let j = 0; j < buffer_size; i += 8, j++) {
          let red = bitmap[i];
          let green = bitmap[i + 1];
          let blue = bitmap[i + 2];
          let pixel1 = (red << 16) | (green << 8) | blue;

          red = bitmap[i + 4];
          green = bitmap[i + 4 + 1];
          blue = bitmap[i + 4 + 2];
          let pixel2 = (red << 16) | (green << 8) | blue;

          buffer[j] =
            (this.#PaletteLookup(pixel1) << 4) | this.#PaletteLookup(pixel2);
        }
        break;
      case 8:
        buffer_size = width * height;
        buffer = new Uint8Array(buffer_size);
        for (let j = 0; j < buffer_size; i += 4, j++) {
          let red = bitmap[i];
          let green = bitmap[i + 1];
          let blue = bitmap[i + 2];

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
            let green = bitmap[i + 1];
            let blue = bitmap[i + 2];
            let clr = (red << 16) | (green << 8) | blue;

            buffer[index + 0] =
              (((clr & 0b0000_0000_0000_0000_0001_1100_0000_0000) >> 5) |
                ((clr & 0b0000_0000_0000_0000_0000_0000_1111_1000) >> 3)) &
              0xff;
            buffer[index + 1] =
              (((clr & 0b0000_0000_1111_1000_0000_0000_0000_0000) >> 16) |
                ((clr & 0b0000_0000_0000_0000_1110_0000_0000_0000) >> 13)) &
              0xff;
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
      throw new Error(
        `Buckets per channel must be between 1 and ${ValuesPerChannel}`
      );
    }

    this.#_bucketSize = ValuesPerChannel / bucketsPerChannel;
  }

  BuildPalette(pixels) {
    let histogram = {};

    for (let i = 0; i < pixels.length; i += 4) {
      let pixel =
        (pixels[i + 0] << 16) | (pixels[i + 1] << 8) | (pixels[i + 2] << 0);

      let key = this.#CreateColorKey(pixel);
      if (key in histogram) {
        histogram[key].push(pixel);
      } else {
        histogram[key] = [pixel];
      }
    }

    // sort buckets
    let buckets = Object.values(histogram);
    let sortedBuckets = buckets.sort((a, b) => a.length - b.length).reverse();

    let palette = new Uint32Array(16);
    let i = 0;
    for (let i = 0; i < 16; i++) {
      palette[i] = this.#AverageColor(sortedBuckets[i % sortedBuckets.length]);
    }
    return palette;
  }

  #AverageColor(colors) {
    let r = 0;
    let g = 0;
    let b = 0;
    for (let color of colors) {
      r += (color >> 16) & 0xff;
      g += (color >> 8) & 0xff;
      b += (color >> 0) & 0xff;
    }
    var count = colors.length;
    r = Math.floor(r / count);
    g = Math.floor(g / count);
    b = Math.floor(b / count);
    return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
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

    // I2C write only
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


class Version {
  constructor() {
    this.Firmware = "";
    this.ProductId = "";
    this.Bootloader = "";
  }

}
class SystemController {
  constructor(serialPort) {
    this.serialPort = serialPort;
    this.version = new Version();

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
  
  async GetVersion() {
    const command = "version()";
    await this.serialPort.WriteCommand(command);

    const resp = await this.serialPort.ReadResponse();

    if (resp.success) {
      if (resp.response && resp.response.length > 0) {

        let versions = resp.response.slice(25).split(':');

        this.version.Firmware = versions[0];
        this.version.ProductId = versions[1];
        this.version.Bootloader = versions[2];
      }
    }

    return this.version;
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

class PulseController {
  constructor(serialPort) {
    this.serialPort = serialPort;
  }

  async Set(pin, pulseCount, pulseDuration) {
    if (pin < 0 || pin >= this.serialPort.DeviceConfig.MaxPinIO) {
      console.log("Invalid pin");
      //throw new ValueError('Invalid pin');
      return false;
    }

    const cmd = `pulse(${pin}, ${pulseCount}, ${pulseDuration})`;
    await this.serialPort.WriteCommand(cmd);

    const response = await this.serialPort.ReadResponse();

    return response.success;
  }
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
    this.Display = new DisplayController(this.serialPort);
    this.Touch = new TouchController(this.serialPort);
    this.Led = new LedController(this.serialPort);
    this.Engine = new EngineController(this.serialPort);
    this.Temperature = new TemperatureController(this.serialPort);
    this.Humidity = new HumidityController(this.serialPort);
    this.System = new SystemController(this.serialPort);

    this.Pulse = new PulseController(this.serialPort);
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
