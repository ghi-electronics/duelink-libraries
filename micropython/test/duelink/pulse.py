
class PulseController:   

    def __init__(self, serialPort):
        self.serialPort = serialPort


    def Read(self, pin: int, state: int, timeout_ms: int)->int:                
        cmd = f"PulseIn({pin}, {state}, {timeout_ms})"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        r,s = self.serialPort.ReadResponse()

        if r:            
            try:
                value = int(s)
                return value
            except:
                pass

        return 0

        
        




       



