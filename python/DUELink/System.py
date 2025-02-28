from enum import Enum
import time

class SystemController:
    class ResetOption(Enum):
        SystemReset = 0
        Bootloader = 1


    def __init__(self, serialPort):
        self.serialPort = serialPort
        self.Version = ""         

    def Reset(self, option : int):
        cmd = "reset({0})".format(option)
        self.serialPort.WriteCommand(cmd)

    def GetTickMicroseconds(self):
        cmd = "tickus()"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        if res.success:
            try:
                return int(res.respone)
            except:
                pass
        return -1
    
    def GetTickMilliseconds(self):
        cmd = "tickms()"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        if res.success:
            try:
                return int(res.respone)
            except:
                pass
        return -1
    






