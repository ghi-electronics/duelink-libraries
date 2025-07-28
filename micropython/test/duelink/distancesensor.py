# CT: 05/26/2025 - Tested
class DistanceSensorController:    

    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Read(self, pin, pull):
        self.serialPort.WriteCommand(f"dread({pin},{pull})")        
        r, s = self.serialPort.ReadResponse()        
        if r:
            return int(s, 10)        

    def Write(self, pin, value):
        self.serialPort.WriteCommand(f"dwrite({pin},{value})")
        r, s = self.serialPort.ReadResponse()
        return r
