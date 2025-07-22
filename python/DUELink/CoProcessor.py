from enum import Enum
from DUELink.SerialInterface import SerialInterface
from DUELink.Stream import StreamController

class CoProcessorController:   

    def __init__(self, serialPort:SerialInterface, stream:StreamController):
        self.serialPort = serialPort
        self.stream = stream

    def CoprocE(self)->bool:
        cmd = "CoprocE()"
        self.serialPort.WriteCommand(cmd)
        ret = self.serialPort.ReadResponse()
        return ret.success

    def CoprocP(self)->bool:
        # need Xmodem 1K, TODO
        raise Exception("Not implemented")
            
    def CoprocE(self)->bool:
        cmd = "CoprocS()"
        self.serialPort.WriteCommand(cmd)
        ret = self.serialPort.ReadResponse()
        return ret.success

    def CoprocV(self) -> str:
        cmd = "CoprocV()"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()

        return res.response
    
    def CoprocW(self, dataWrite: bytes) -> int:
        count = len(dataWrite)

        # declare b9 array
        cmd = f"dim b9[{count}]"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        # write data to b9
        written = self.stream.WriteBytes("b9",dataWrite)

        # write b9 to co-pro
        self.serialPort.WriteCommand("CoprocW(b9)")
        ret = self.serialPort.ReadResponse()
        
        if written == len(dataWrite):            
            return written
        return 0        
    
    def CoprocR(self, dataRead: bytes)-> int:
        count = len(dataRead)

        # declare b9 array
        cmd = f"dim b9[{count}]"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        # read data to b9
        self.serialPort.WriteCommand("CoprocR(b9)")
        ret = self.serialPort.ReadResponse()

        # read b9 by stream
        read = self.stream.ReadBytes("b9",dataRead )

        if ret.success:
            return read
        return 0 

