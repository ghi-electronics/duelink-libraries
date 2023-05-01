class DisplayController:
    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Show(self):
        cmd = "lcdshow()"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def Clear(self, color):
        cmd = f"lcdclear({color})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def SetPixel(self, color, x, y):
        cmd = f"lcdpixel({color},{x},{y})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def DrawCircle(self, color, x, y, radius):
        cmd = f"lcdcircle({color},{x},{y},{radius})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def DrawRectangle(self, color, x, y, width, height):
        cmd = f"lcdrect({color},{x},{y},{width},{height})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def DrawLine(self, color, x1, y1, x2, y2):
        cmd = f"lcdline({color},{x1},{y1},{x2},{y2})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def DrawText(self, text, color, x, y):
        cmd = f"lcdtext(\"{text}\",{color},{x},{y})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def DrawTextScale(self, text, color, x, y, scalewidth, scaleheight):
        cmd = f"lcdtexts(\"{text}\",{color},{x},{y},{scalewidth},{scaleheight})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def __Stream(self, data):
        cmd = "lcdstream()"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()

        if res.success:
            self.serialPort.WriteRawData(data, 0, len(data))
            # time.sleep(10)
            res = self.serialPort.ReadRespone()

        return res.success
    
    def DrawBuffer(self, color, offset: int, length: int):
        WIDTH = 128
        HEIGHT = 64

        if (length > WIDTH * HEIGHT) :
            raise Exception("Only 64*128 supported.")

        data = bytearray(int(WIDTH*HEIGHT/8))
        i = 0

        for y in range(0, HEIGHT):
            for x in range(0, WIDTH):

                index = (y >> 3) * WIDTH + x

                if ((color[i] & 0x00FFFFFF) != 0): # no alpha
                    data[index] |= (1 << (y & 7)) & 0xFF
                
                else:
                    data[index] &= (~(1 << (y & 7))) & 0xFF
                
                i += 1                

        return self.__Stream(data)

