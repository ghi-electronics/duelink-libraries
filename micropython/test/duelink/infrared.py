class InfraredController:
    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Read(self)->int:
        cmd = "irread()"
        self.serialPort.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()

        if r:
            try:
                return int(s)
            except:
                pass
        return -1
    
    def Write(self, command: int)->bool:
        cmd = f"IrWrite({command})"
        self.serialPort.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()
        return r

    def Enable(self, txpin:int, rxpin: int)->bool:
        cmd = f"iren({txpin}, {rxpin}})"
        self.serialPort.WriteCommand(cmd)

        r,s = self.serialPort.ReadResponse()
        return r
