from enum import Enum
from DUELink.SerialInterface import SerialInterface
from DUELink.Stream import StreamController

class CoProcessorController:   

    def __init__(self, serialPort:SerialInterface, stream:StreamController):
        self.serialPort = serialPort
        self.stream = stream

    def CoprocE(self):
        cmd = "CoprocE()"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()

    def CoprocP(self):
        # need Xmodem 1K, TODO
        raise Exception("Not implemented")
            
    def CoprocE(self):
        cmd = "CoprocS()"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()

    def CoprocV(self) -> str:
        cmd = "CoprocV()"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()

        return res.response
    
    def CoprocW(self, dataWrite: bytes):
        count = len(dataWrite)

        # declare b9 array
        cmd = f"dim b9[{count}]"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        # write data to b9
        ret = self.stream.WriteBytes("b9",dataWrite)

        # write b9 to co-pro
        if ret == len(dataWrite):            
            self.serialPort.WriteCommand("CoprocW(b9)")
            self.serialPort.ReadResponse()

            return ret
        return 0        
    
    def CoprocR(self, dataRead: bytes):
        count = len(dataRead)

        # declare b9 array
        cmd = f"dim b9[{count}]"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        # read data to b9
        self.serialPort.WriteCommand("CoprocR(b9)")
        self.serialPort.ReadResponse()

        # read b9 by stream
        ret = self.stream.ReadBytes("b9",dataRead )

        return ret

