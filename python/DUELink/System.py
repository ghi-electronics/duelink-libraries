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
        self.serialPort.WriteCommand(cmd)
        # The device will reset in bootloader or system reset
        self.serialPort.Disconnect()

    def GetTickMicroseconds(self):
        cmd = "log(tickus())"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        if res.success:
            try:
                return int(res.respone)
            except:
                pass
        return -1
    
    def GetTickMilliseconds(self):
        cmd = "log(tickms())"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        if res.success:
            try:
                return int(res.respone)
            except:
                pass
        return -1
    
    
    
    def __PrnText(self, text:str, newline: bool):
        cmd = f"print(\"{text}\")"

        if (newline):
            cmd = f"println(\"{text}\")"

        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()        
        


    def Print(self, text)->bool:
        print(text)

        if isinstance(text, str):
            self.__PrnText(text, False)
        elif isinstance(text, bool):
            self.__PrnText('1' if True else '0', False)
        else:
            self.__PrnText(str(text), False)

        return True
    
    def Println(self, text)->bool:
        print(text)
        if isinstance(text, str):
            self.__PrnText(text, True)
        elif isinstance(text, bool):
            self.__PrnText('1' if text else '0', True)
        else:
            self.__PrnText(str(text), True)

        return True
    
    def Wait(self, millisecond: int)->bool:
        cmd = f"wait({millisecond})"       
        self.serialPort.WriteCommand(cmd)
        time.sleep(millisecond / 1000)
        res = self.serialPort.ReadRespone()
        return res.success

    






