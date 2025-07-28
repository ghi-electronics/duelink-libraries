
class HudimityController:
    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Read(self, pin: int, sensortype: int) -> float:
    
        cmd = f"humid({pin},{sensortype})"
        self.serialPort.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()

        if r:
            try:
                return float(s)
            except:
                pass

        return 0 
        
    
    
