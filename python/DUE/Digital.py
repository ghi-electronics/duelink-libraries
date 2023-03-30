
from DUE.Const import MAX_IO

class Input:
    PULL_NONE = 0
    PULL_UP = 1
    PULL_DOWN = 2


class DigitalController:    

    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Read(self, pin: int, inputType: Input = Input.PULL_NONE) -> bool:
        if pin < 0 or pin >= MAX_IO:
            raise ValueError("Invalid pin")

        pull = "0"
        if inputType == Input.PULL_UP:
            pull = "1"
        elif inputType == Input.PULL_DOWN:
            pull = "2"

        cmd = f"print(dread({pin},{pull}))"
        self.serialPort.WriteCommand(cmd)

        respone = self.serialPort.ReadRespone()

        if respone.success:
            respone.respone = self.serialPort.RemoveEchoRespone(respone.respone, cmd)
            try:
                value = int(respone.respone)
                return value == 1
            except:
                pass

        return False

    def Write(self, pin: int, value: bool) -> bool:
        if pin < 0 or pin >= MAX_IO:
            raise ValueError("Invalid pin")

        cmd = f"dwrite({pin},{1 if value else 0})"
        self.serialPort.WriteCommand(cmd)

        respone = self.serialPort.ReadRespone()

        return respone.success
