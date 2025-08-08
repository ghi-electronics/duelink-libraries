
class ButtonController:    

    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Enable(self, pin: int, enable: bool, pull: int) -> bool:      
        cmd = f"btnen({pin}, {int(enable)}, {pull})"

        self.serialPort.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()

        return r
            
    def Up(self, pin):
        cmd = f"btnup({pin})"

        self.serialPort.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()

        if r:
            try:
                return int(s) == 1
            except:
                pass

        return False   
    
    def Down(self, pin):
        cmd = f"btndown({pin})"

        self.serialPort.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()

        if r:
            try:
                return int(s) == 1
            except:
                pass

        return False
