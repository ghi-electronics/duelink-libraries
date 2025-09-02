
class CoProcessorController:    

    def __init__(self, serialPort,stream):
        self.transport = serialPort
        self.stream = stream

    def Erase(self)->bool:
        cmd = "CoprocE()"
        self.transport.WriteCommand(cmd)
        r,s = self.transport.ReadResponse()
        return s
    
    def Program(self)->bool:
        # need Xmodem 1K, TODO
        raise Exception("Not implemented")
            
    def Reset(self)->bool:
        cmd = "CoprocS()"
        self.transport.WriteCommand(cmd)
        r,s = self.transport.ReadResponse()
        return r

    def Version(self) -> str:
        cmd = "CoprocV()"
        self.transport.WriteCommand(cmd)
        r,s = self.transport.ReadResponse()

        return (s)
    
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
        r,s = self.transport.ReadResponse()
        
        if written == len(dataWrite):            
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
        r,s = self.transport.ReadResponse()

        # read b9 by stream
        read = self.stream.ReadBytes("b9",dataRead )

        if r:
            return read
        return 0 
