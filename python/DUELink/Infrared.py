class InfraredController:
    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Read(self)->int:
        cmd = "irread()"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()

        if res.success:
            try:
                return int(res.response)
            except:
                pass
        return -1
    
    def Write(self, command: int)->bool:
        cmd = f"IrWrite({command})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success

    def Enable(self, txpin:int, rxpin: int, enable: bool)->bool:
        cmd = f"iren({txpin}, {rxpin}, {int(enable)})"
        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadResponse()
        return res.success
