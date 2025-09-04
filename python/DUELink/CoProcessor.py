from enum import Enum
from DUELink.SerialInterface import SerialInterface
from DUELink.Stream import StreamController

class CoProcessorController:   

    def __init__(self, transport:SerialInterface, stream:StreamController):
        self.transport = transport
        self.stream = stream

    def Erase(self)->bool:
        cmd = "CoprocE()"
        self.transport.WriteCommand(cmd)
        ret = self.transport.ReadResponse()
        return ret.success

    def Program(self)->bool:
        # need Xmodem 1K, TODO
        raise Exception("Not implemented")
            
    def Reset(self)->bool:
        cmd = "CoprocS()"
        self.transport.WriteCommand(cmd)
        ret = self.transport.ReadResponse()
        return ret.success

    def Version(self) -> str:
        cmd = "CoprocV()"
        self.transport.WriteCommand(cmd)
        res = self.transport.ReadResponse()

        return res.response
    
    def Write(self, dataWrite: bytes) -> int:
        count = len(dataWrite)

        # declare b9 array
        cmd = f"dim b9[{count}]"
        self.transport.WriteCommand(cmd)
        self.transport.ReadResponse()

        # write data to b9
        written = self.stream.WriteBytes("b9",dataWrite)

        # write b9 to co-pro
        self.transport.WriteCommand("CoprocW(b9)")
        ret = self.transport.ReadResponse()
        
        if ret.success:
            return written
        return 0        
    
    def Read(self, dataRead: bytes)-> int:
        count = len(dataRead)

        # declare b9 array
        cmd = f"dim b9[{count}]"
        self.transport.WriteCommand(cmd)
        self.transport.ReadResponse()

        # read data to b9
        self.transport.WriteCommand("CoprocR(b9)")
        ret = self.transport.ReadResponse()

        # read b9 by stream
        read = self.stream.ReadBytes("b9",dataRead )

        if ret.success:
            return read
        return 0 

