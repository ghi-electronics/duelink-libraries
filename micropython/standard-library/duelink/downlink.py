

class DownlinkController:
    def __init__(self, serialPort):
        self.transport = serialPort        
    
    def SetMode(self, mode):
        self.transport.WriteCommand(f'dlmode({mode})')
        r,s = self.transport.ReadResponse()

        if r:
            try:
                return int(s)
            except:
                pass

        return 0
    
    def Command(self, s:str) -> float:
        self.transport.WriteCommand(f'cmd(\"{s}\")')
        r,s = self.transport.ReadResponse()

        if r:
            try:
                return float(s)
            except:
                pass

        return 0
    
    def SetTimeout(self, timeout):
        self.transport.WriteCommand(f'cmdtmot({timeout})')
        r,s = self.transport.ReadResponse()

        if r:
            try:
                return int(s)
            except:
                pass

        return 0
    
    