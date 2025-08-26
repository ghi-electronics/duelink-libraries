import time
from DUELink.SerialInterface import SerialInterface

class EngineController:
    def __init__(self, serialPort : SerialInterface):
        self.serialPort = serialPort
        self.loadscript = ""    

    # run("version()/list") return version string, so need to return a string
    def Run(self) -> str:        
        self.serialPort.WriteCommand("run")
        
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
    
    def Record(self, script,region) -> bool:
        if region == 0:
            self.serialPort.WriteCommand("new all")  
            res = self.serialPort.ReadResponse() 
            if res.success == False:
                return False
        elif region == 1:
            self.serialPort.WriteCommand("region(1)")  
            res = self.serialPort.ReadResponse() 
            if res.success == False:
                return False
            
            self.serialPort.WriteCommand("new")  
            res = self.serialPort.ReadResponse() 
            if res.success == False:
                return False
        else:
            return False
        
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
        res = self.serialPort.ReadResponseRaw()

        return res.response 

    def WriteCommand(self, cmd:str) -> str:
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()

        return res.response

    def Cmd(self, s:str) -> str:
        return self.WriteCommand(f"cmd({s})")


    

       