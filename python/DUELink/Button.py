from enum import Enum

class ButtonController:   

    def __init__(self, serialPort):
        self.serialPort = serialPort
        
    def Enable(self, pin: int, state: bool) -> bool:         
        cmd = f"btnen({pin}, {int(state)})"

        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()

        return res.success
    
    def Down(self, pin: int) -> bool:

      
        cmd = f"btndown({pin})"

        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()

        if res.success:
            try:
                return int(res.response) == 1
            except:
                pass

        return False
    
    def Up(self, pin: int) -> bool:

        cmd = f"btnup({pin})"

        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()

        if res.success:
            try:
                return int(res.response) == 1
            except:
                pass

        return False  

    def Read(self, pin: int) -> bool:

        cmd = f"btnread({pin})"

        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()

        if res.success:
            try:
                return int(res.response) == 1
            except:
                pass

        return False         
       
