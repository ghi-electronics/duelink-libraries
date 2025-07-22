
from DUELink.SerialInterface import SerialInterface

class DigitalController:    

    def __init__(self, serialPort:SerialInterface):
        self.serialPort = serialPort

    def Read(self, pin, inputType: int) -> bool:

        if pin < 0 or pin > self.serialPort.DeviceConfig.MaxPinIO:
            raise ValueError("Invalid pin")

        if not isinstance(inputType, int) or inputType not in (0, 1, 2):
            raise ValueError("Invalid inputType. Enter an integer 0-2")    

        cmd = f"dread({pin},{inputType})"
        self.serialPort.WriteCommand(cmd)

        ret = self.serialPort.ReadResponse()

        if ret.success:            
            try:
                value = int(ret.response)
                return value == 1
            except:
                pass

        return False

    def Write(self, pin: int, value: bool) -> bool:

        if pin < 0 or pin > self.serialPort.DeviceConfig.MaxPinIO:
            raise ValueError("Invalid pin")
        
        cmd = f"dwrite({pin},{1 if value else 0})"
        self.serialPort.WriteCommand(cmd)

        ret = self.serialPort.ReadResponse()

        return ret.success
