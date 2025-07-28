

class EngineController:
    def __init__(self, serialPort):
        self.serialPort = serialPort
        self.loadscript = ""    
    
    def Record(self, script) -> bool:
        # TODO
        return False
            
    def Read(self) -> str:
        # TODO
        return ""
    
    def Run(self, script : str) -> bool:
        self.serialPort.WriteCommand(script)        
        r,s = self.serialPort.ReadResponse()        
        return r

    def Select(self, num):
        cmd = f"sel({num})"
        self.serialPort.WriteCommand(cmd)
        
        r,s = self.serialPort.ReadResponse()
        
        return r
        


       