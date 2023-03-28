from enum import Enum
import time

class SystemController:
    class ResetOption(Enum):
        SystemReset = 0
        Bootloader = 1

    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Reset(self, option : Enum):
        cmd = "reset({0})".format(1 if option.value == 1 else 0)
        self.serialPort.WriteLine(cmd)
        # The device will reset in bootloader or system reset
        self.serialPort.Disconnect()

    def GetMicroTicks(self):
        cmd = "print(getticks())"
        self.serialPort.WriteLine(cmd)
        res = self.serialPort.ReadRespone()
        if res.success:
            try:
                return int(res.respone)
            except:
                pass
        return -1
    
    def GetSecond(self):
        cmd = "print(getseconds())"
        self.serialPort.WriteLine(cmd)
        res = self.serialPort.ReadRespone()
        if res.success:
            try:
                return int(res.respone)
            except:
                pass
        return -1
    
    def IsProgramMode(self)->bool:
        cmd = bytearray(1)
        data = bytearray(1)
    
        cmd[0] = 255
        
        self.serialPort.WriteRawData(cmd, 0, 1)

        time.sleep(0.01)

        self.serialPort.ReadRawData(data,0,1)

        if (data[0]== 255):
            return True
        
        return False
    
    def ExitProgramMode(self) -> bool:
        cmd = bytearray(1)
        cmd[0] = 127

        self.serialPort.WriteRawData(cmd, 0, 1)

        time.sleep(0.01)

        res = self.serialPort.ReadRespone()

        return res.success





