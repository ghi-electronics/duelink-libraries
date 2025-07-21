import time
from DUELink.SerialInterface import SerialInterface

class EngineController:
    def __init__(self, serialPort : SerialInterface):
        self.serialPort = serialPort
        self.loadscript = ""    

    
    def Record(self, script) -> bool:
        self.serialPort.WriteCommand("new")

        res = self.serialPort.ReadResponse()
        if not res.success:
            raise ValueError("Unable to erase the chip memory.")

        cmd = "pgmbrst()"

        raw = script.encode('ASCII')

        data = bytearray(len(raw) + 1)

        data[len(raw)] = 0

        data[0:len(raw)] = raw        

        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadResponse()

        if (res.success == False) :
            return False
        
        self.serialPort.WriteRawData(data, 0, len(data))

        res = self.serialPort.ReadResponse()

        return res.success
            
    def Read(self) -> str:
        cmd = "list"

        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse2()

        return res.respone
    
    def Run(self, script : str) -> bool:
        cmd = script
        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadResponse()

        return res.respone

    def Select(self, num):
        cmd = f"sel({num})"

        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadResponse()

        return res.respone

       