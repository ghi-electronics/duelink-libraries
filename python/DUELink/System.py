from enum import Enum
import time
import re

class SystemController:
    class ResetOption(Enum):
        SystemReset = 0
        Bootloader = 1


    def __init__(self, serialPort):
        self.serialPort = serialPort
        self.Version = ""         

    def Reset(self, option : int):
        cmd = "reset({0})".format(1 if option == 1 else 0)
        self.serialPort.WriteCommand(cmd)
        # The device will reset in bootloader or system reset
        self.serialPort.Disconnect()

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
    
    def GetVersion(self):
        command = "version()"
        self.serialPort.WriteCommand(command)

        version = self.serialPort.ReadRespone()

        # self.ReadCommandComplete()

        match = re.match(r"^([\w\s]+).*?(v[\d\.].*)", version.respone)


        if version.success:
            #if self.echo and command in version.respone:
            #if self.echo :
                # echo is on => need to turn off
            self.serialPort.TurnEchoOff()
            self.serialPort.portName.reset_input_buffer()
            self.serialPort.portName.reset_output_buffer()
            version.respone = version.respone[len(command):]

        version_firmware = match.group(2).split(":")[0]
        prod_id = match.group(2).split(":")[1]
        version_boot_loader = match.group(2).split(":")[2]


        return version_firmware, prod_id, version_boot_loader
    
    def Info(self, code):
        cmd = f"info({code})"
        self.serialPort.WriteCommand(cmd)

        respone = self.serialPort.ReadRespone()

        if respone.success:            
            try:
                value = int(respone.respone)
                return value
            except:
                pass

        return 0

    






