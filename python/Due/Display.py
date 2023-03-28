class DisplayController:
    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Show(self):
        cmd = "lcdshow()"
        self.serialPort.WriteLine(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def Clear(self, color):
        cmd = f"lcdclear({color})"
        self.serialPort.WriteLine(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def SetPixel(self, color, x, y):
        cmd = f"lcdpixel({color},{x},{y})"
        self.serialPort.WriteLine(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def DrawCircle(self, color, x, y, radius):
        cmd = f"lcdcircle({color},{x},{y},{radius})"
        self.serialPort.WriteLine(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def DrawRectangle(self, color, x, y, width, height):
        cmd = f"lcdrect({color},{x},{y},{width},{height})"
        self.serialPort.WriteLine(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def DrawLine(self, color, x1, y1, x2, y2):
        cmd = f"lcdline({color},{x1},{y1},{x2},{y2})"
        self.serialPort.WriteLine(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def DrawText(self, text, color, x, y):
        cmd = f"lcdtext(\"{text}\",{color},{x},{y})"
        self.serialPort.WriteLine(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def DrawTextScale(self, text, color, x, y, scalewidth, scaleheight):
        cmd = f"lcdtexts(\"{text}\",{color},{x},{y},{scalewidth},{scaleheight})"
        self.serialPort.WriteLine(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def Stream(self, data):
        cmd = "lcdstream()"
        self.serialPort.WriteLine(cmd)
        res = self.serialPort.ReadRespone()

        if res.success:
            self.serialPort.WriteRawData(data, 0, len(data))
            # time.sleep(10)
            res = self.serialPort.ReadRespone()

        return res.success

