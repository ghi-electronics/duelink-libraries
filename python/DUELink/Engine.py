import time
from DUELink.SerialInterface import SerialInterface

class EngineController:
    def __init__(self, serialPort : SerialInterface):
        self.serialPort = serialPort
        self.loadscript = ""    

    # run("version()/list") return version string, so need to return a string
    def Run(self, script : str) -> str:        
        self.serialPort.DiscardInBuffer()
        self.serialPort.DiscardOutBuffer()
        
        cmd = script + "\n"
        self.serialPort.WriteRawData(bytes(cmd, 'utf-8'), 0, len(cmd))
        
        res = self.serialPort.ReadResponse()

        return res.response
    
    def Stop(self) -> str:        
        self.serialPort.DiscardInBuffer()
        self.serialPort.DiscardOutBuffer()
        
        data = bytearray(1)
        data[0] = 27
        self.serialPort.WriteRawData(data, 0, len(data))
        
        res = self.serialPort.ReadResponse()

        return res.response
    
    def Select(self, num)->bool:
        cmd = f"sel({num})"

        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadResponse()

        return res.success
    
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

        return res.response    

    

       