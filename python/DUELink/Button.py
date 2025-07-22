from enum import Enum

class ButtonController:   

    def __init__(self, serialPort):
        self.serialPort = serialPort
        
    def Enable(self, pin: int, enable: bool, pull: int) -> bool:         
        cmd = f"btnen({pin}, {int(enable)}, {pull})"

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
       
