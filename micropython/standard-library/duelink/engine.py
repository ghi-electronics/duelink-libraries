

class EngineController:
    def __init__(self, serialPort):
        self.serialPort = serialPort
        self.loadscript = ""    
    
    def Record(self, script,region) -> bool:
        if region == 0:
            self.serialPort.WriteCommand("new all")  
            r,s = self.serialPort.ReadResponse() 
            if r == False:
                return False
        elif region == 1:
            self.serialPort.WriteCommand("region(1)")  
            r,s = self.serialPort.ReadResponse() 
            if r == False:
                return False
            
            self.serialPort.WriteCommand("new")  
            r,s = self.serialPort.ReadResponse() 
            if r == False:
                return False
        else:
            return False
               
        cmd = "pgmbrst()"

        raw = script.encode('ASCII')

        data = bytearray(len(raw) + 1)

        data[len(raw)] = 0

        data[0:len(raw)] = raw        

        self.serialPort.WriteCommand(cmd)

        r,s = self.serialPort.ReadResponse()

        if (r == False) :
            return False
        
        self.serialPort.WriteRawData(data, 0, len(data))

        r,s = self.serialPort.ReadResponse()

        return r
            
    def Read(self) -> str:
        cmd = "list"

        self.serialPort.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()

        return s   
    
    def Run(self) -> str:
        self.serialPort.WriteCommand("run")        
        r,s = self.serialPort.ReadResponse()        
        return s
    
    def Stop(self) -> str:                
        data = bytearray(1)
        data[0] = 27
        self.serialPort.WriteRawData(data, 0, len(data))
        
        res = self.serialPort.ReadResponse()

        return res.response
    
    def New(self):
        self.serialPort.WriteCommand(f"new")        
        r,s = self.serialPort.ReadResponse()           
        return r

    def Select(self, num):
        cmd = f"sel({num})"
        self.serialPort.WriteCommand(cmd)
        
        r,s = self.serialPort.ReadResponse()
        
        return r
    
    def WriteCommand(self, cmd:str) -> str:
        self.serialPort.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()

        return s
        


       