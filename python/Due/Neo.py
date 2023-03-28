import time

class NeoController:
    MAX_LED_NUM = 256

    def __init__(self, serialPort):
        self.serialPort = serialPort
        self.SupportLedNumMax = self.MAX_LED_NUM

    def Show(self, count):
        cmd = "neoshow({0})".format(count)
        self.serialPort.WriteLine(cmd)

        # each led need 1.25us delay blocking mode
        delay = (self.MAX_LED_NUM * 3 * 8 * 1.25) / 1000000
        time.sleep(delay)

        res = self.serialPort.ReadRespone()

        return res.success

    def Clear(self):
        cmd = "neoclear()"
        self.serialPort.WriteLine(cmd)

        res = self.serialPort.ReadRespone()

        return res.success

    def SetColor(self, id, red, green, blue):
        if id < 0 or id > self.MAX_LED_NUM:
            return False

        cmd = "neoset({0},{1},{2},{3})".format(id, red, green, blue)
        self.serialPort.WriteLine(cmd)

        res = self.serialPort.ReadRespone()

        return res.success

    def Stream(self, data):
        if len(data) > self.MAX_LED_NUM * 3:
            return False

        cmd = "neostream({0})".format(len(data))
        self.serialPort.WriteLine(cmd)

        res = self.serialPort.ReadRespone()

        if res.success:
            self.serialPort.WriteRawData(data, 0, len(data))
            res = self.serialPort.ReadRespone()

        return res.success
