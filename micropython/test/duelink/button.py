
class ButtonController:    

    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Enable(self, pin: int, state: int) -> bool:      
        cmd = f"btnen({pin}, {int(state)})"

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
        
    def Read(self, pin):
        cmd = f"btnread({pin})"

        self.serialPort.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()

        if r:
            try:
                return int(s) == 1
            except:
                pass

        return False
