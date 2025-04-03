
class DigitalController:    

    def __init__(self, transport):
        self.transport = transport

    def Read(self, pin, pull):
        r, s = self.execute(f"dread({pin},{pull})")
        if s:
            return int(r, 10)        

    def Write(self, pin, value):
        self.transport.execute(f"dwrite({pin},{value})")
