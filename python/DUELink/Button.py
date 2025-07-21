from enum import Enum

class ButtonController:   

    def __init__(self, serialPort):
        self.serialPort = serialPort

    def IsButtonValid(self, pin: int) ->bool:
        pass
        # if pin < 0 or (pin > 7 and pin != 12):
        #     return False
        # return True
        
    def Enable(self, pin: int, enable: bool, pull: int) -> bool:

        if self.IsButtonValid(pin) == False:
            raise ValueError("Invalid pin")
    
        cmd = f"btnen({pin}, {int(enable)}, {pull})"

        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()

        return res.success
    
    def Up(self, pin: int) -> bool:

        if self.IsButtonValid(pin) == False:
            raise ValueError("Invalid pin")
            
        cmd = f"btndown({pin})"

        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()

        if res.success:
            try:
                return int(res.respone) == 1
            except:
                pass

        return False
    
    def Down(self, pin: int) -> bool:

        if self.IsButtonValid(pin) == False:
            raise ValueError("Invalid pin")
            
        cmd = f"btnup({pin})"

        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()

        if res.success:
            try:
                return int(res.respone) == 1
            except:
                pass

        return False   
       
