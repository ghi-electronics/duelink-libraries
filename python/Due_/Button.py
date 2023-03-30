from enum import Enum

class ButtonController:   

    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Enable(self, pin: int, enable: bool) -> bool:
        if not 97 <= pin <= 98:
            if not 0 <= pin <= 2:
                raise ValueError("Accept pins: 0,1,2,97,98")

        cmd = f"btnenable({pin}, {int(enable)})"

        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()

        return res.success
    
    def IsPressed(self, pin: int) -> bool:
        if not 97 <= pin <= 98:
            if not 0 <= pin <= 2:
                raise ValueError("Accept pins: 0,1,2,97,98")
            
        cmd = f"print(btndown({pin}))"

        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()

        if res.success:
            try:
                return int(res.respone) == 1
            except:
                pass

        return False
    
    def IsReleased(self, pin: int) -> bool:
        if not 97 <= pin <= 98:
            if not 0 <= pin <= 2:
                raise ValueError("Accept pins: 0,1,2,97,98")
            
        cmd = f"print(btnup({pin}))"

        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()

        if res.success:
            try:
                return int(res.respone) == 1
            except:
                pass

        return False

    class Buttons:
        A = 97
        B = 98    
       
