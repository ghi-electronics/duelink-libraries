import time
from DUELink.SerialInterface import SerialInterface

class DownlinkController:
    def __init__(self, transport : SerialInterface):
        self.transport = transport        

    def SetMode(self, mode):
        self.transport.WriteCommand(f'dlmode({mode})')
        ret = self.transport.ReadResponse()

        if ret.success:
            try:
                return int(ret.response)
            except:
                pass

        return 0
    
    def Command(self, s:str) -> float:
        self.transport.WriteCommand(f'cmd({s})')
        ret = self.transport.ReadResponse()

        if ret.success:
            try:
                return float(ret.response)
            except:
                pass

        return 0
    
    def SetTimeout(self, timeout):
        self.transport.WriteCommand(f'cmdtmot({timeout})')
        ret = self.transport.ReadResponse()

        if ret.success:
            try:
                return int(ret.response)
            except:
                pass

        return 0


    

       