

class EngineController:
    def __init__(self, transport):
        self.transport = transport
        self.loadscript = ""    
    
    def Record(self, script) -> bool:
        # TODO
        return False
            
    def Read(self) -> str:
        # TODO
        return ""
    
    def Run(self, script : str) -> bool:
        cmd = script
        self.transport.execute(cmd)

    def Select(self, num):
        cmd = f"sel({num})"
        self.transport.execute(cmd)
        


       