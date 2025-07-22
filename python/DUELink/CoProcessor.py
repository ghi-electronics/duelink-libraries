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

        # declare b1 array
        cmd = f"dim(b1[{count}])"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        # write data to b1
        ret = self.stream.WriteBytes("b1",dataWrite)

        # write b1 to co-pro
        if ret == len(dataWrite):            
            self.serialPort.WriteCommand("CoprocW(b1)")
            self.serialPort.ReadResponse()

            return ret
        return 0        
    
    def CoprocR(self, dataRead: bytes):
        count = len(dataRead)

        # declare b1 array
        cmd = f"dim(b1[{count}])"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        # read data to b1
        self.serialPort.WriteCommand("CoprocR(b1)")
        self.serialPort.ReadResponse()

        # read b1 by stream
        ret = self.stream.ReadBytes("b1",dataRead )

        return ret

