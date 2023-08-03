class InfraredController:
    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Read(self):
        cmd = "log(irread())"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        if res.success:
            try:
                return int(res.respone)
            except:
                pass
        return -1

    def Enable(self, pin:int, enable: bool):
        en = 0

        if enable == True:
            en = 1
        if pin != 2 and pin != 8:
            raise ValueError("IR is only available on pin 2 and 8")
        
        cmd = f"irenable({pin}, {int(enable)})"
        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadRespone()

        if res.success:
            return True

        return False
