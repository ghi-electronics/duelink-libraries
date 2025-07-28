# CT: 05/26/2025 - Tested
class DigitalController:    

    def __init__(self, transport):
        self.transport = transport

    def Read(self, pin, pull):
        self.transport.WriteCommand(f"dread({pin},{pull})")
        r, s = self.transport.ReadResponse()        
        if r:
            print(s)
            return int(s, 10)        

    def Write(self, pin, value):
        self.transport.WriteCommand(f"dwrite({pin},{value})")
        r, s = self.transport.ReadResponse()
        return r
