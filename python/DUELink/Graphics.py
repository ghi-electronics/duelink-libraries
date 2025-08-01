from enum import IntEnum


class GraphicsType(IntEnum):    
    I2C = 1
    SPI = 2
    Neo = 3
    Matrix5x5 = 4


class GraphicsController:
    def __init__(self, serialPort):
        self.serialPort = serialPort
    
    def Configuration(self, displayType, config, width, height, mode)->bool:

        if not isinstance(config, list) or not all(isinstance(x, int) and 0 <= x <= 255 for x in config):
            raise ValueError("Enter a list with one number into the config with a valid code for a display.")
    
        inputConfig = map(hex, config)
        
        inputConfigArray = ",".join(inputConfig)
        
        inputConfigArray = "{" + inputConfigArray + "}"
        
        cmd = f"gfxcfg({displayType}, {inputConfigArray}, {width}, {height}, {mode})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success
        
    def Show(self)->bool:
        cmd = "show()"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success

    def Clear(self, color)->bool:
        cmd = f"clear({color})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success

    def Pixel(self, color, x, y)->bool:
        cmd = f"pixel({color},{x},{y})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success

    def Circle(self, color, x, y, radius)->bool:
        cmd = f"circle({color},{x},{y},{radius})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success

    def Rect(self, color, x, y, width, height)->bool:
        cmd = f"rect({color},{x},{y},{width},{height})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success

    def Fill(self, color, x, y, width, height)->bool:
        cmd = f"fill({color},{x},{y},{width},{height})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success

    def Line(self, color, x1, y1, x2, y2)->bool:
        cmd = f"line({color},{x1},{y1},{x2},{y2})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success

    def Text(self, text, color, x, y)->bool:
        cmd = f"text(\"{text}\",{color},{x},{y})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success
    
    def TextT(self, text, color, x, y)->bool:
        cmd = f"textt(\"{text}\",{color},{x},{y})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success

    def TextS(self, text, color, x, y, scalewidth, scaleheight)->bool:
        cmd = f"texts(\"{text}\",{color},{x},{y},{scalewidth},{scaleheight})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success

    # def __Stream(self, data, color_depth: int):
    #     cmd = f"stream({color_depth})"
    #     self.serialPort.WriteCommand(cmd)
    #     res = self.serialPort.ReadResponse()

    #     if res.success:
    #         self.serialPort.WriteRawData(data, 0, len(data))
    #         # time.sleep(10)
    #         res = self.serialPort.ReadResponse()

    #     return res.success

    def DrawImageScale(self, img, x: int, y: int, width: int, height: int, scaleWidth: int, scaleHeight: int, transform: int) -> bool:

        if width <= 0 or height <= 0 or len(img) < width * height:
            raise Exception("Invalid arguments")

        cmd = f"dim b9[{len(img)}]"

        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()

        for i in range(len(img)):
            cmd = f"b9[{(i)}] = {img[i]}"
            self.serialPort.WriteCommand(cmd)
            res = self.serialPort.ReadResponse()

            if (res.success == False):
                break

        if (res.success == True):
            cmd = f"imgs(b9, {x}, {y}, {width}, {height}, {scaleWidth}, {scaleHeight}, {transform})"

            self.serialPort.WriteCommand(cmd)
            res = self.serialPort.ReadResponse()

        cmd = "dim b9[0]"

        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()

        return res.success

    def DrawImage(self, img, x: int, y: int, width: int, height: int, transform: int) -> bool:
        return self.DrawImageScale(img, x, y, width, height, 1, 1, transform)