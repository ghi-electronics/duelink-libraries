class InfraredController:
    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Read(self):
        cmd = "irread()"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()

        if res.success:
            try:
                return int(res.respone)
            except:
                pass
        return -1

    def Enable(self, pin:int, enable: bool):
        
        if pin != 0:
            raise ValueError("IR is only available on pin 0")
        
        cmd = f"iren({pin}, {int(enable)})"
        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadResponse()

        if res.success:
            return True

        return False
