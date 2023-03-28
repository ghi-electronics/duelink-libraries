class InfraredController:
    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Read(self):
        cmd = "print(irread())"
        self.serialPort.WriteLine(cmd)
        res = self.serialPort.ReadRespone()
        if res.success:
            try:
                return int(res.respone)
            except:
                pass
        return -1

    def Enable(self, enable):
        cmd = "irenable({})".format(int(enable))
        self.serialPort.WriteLine(cmd)

        res = self.serialPort.ReadRespone()

        if res.success:
            return True

        return False
