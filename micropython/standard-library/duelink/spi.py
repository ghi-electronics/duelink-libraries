

class SpiController:
    def __init__(self, serialPort, stream):
        self.transport = serialPort
        self.stream = stream

    def Configuration(self, mode, frequency)->bool:                    
        cmd = f"spicfg({mode}, {frequency})"
        self.transport.WriteCommand(cmd)
        r,s = self.transport.ReadResponse()
        return r
    
    def WriteByte(self, data: int)->int:            
        cmd = f"spiwr({data})"
        self.transport.WriteCommand(cmd)
        r,s = self.transport.ReadResponse()
        if r:            
            try:
                value = int(s)
                return value
            except:
                pass

        return 0


    def WriteRead(self, dataWrite: bytes, dataRead: bytearray) -> bool:
        countWrite = len(dataWrite)
        countRead = len(dataRead)
        

        # declare b9 to write    
        cmd = f"dim b9[{countWrite}]"
        self.transport.WriteCommand(cmd)
        self.transport.ReadResponse()

        # declare b8 to read
        cmd = f"dim b8[{countRead}]"
        self.transport.WriteCommand(cmd)
        self.transport.ReadResponse()

        # write data to b9 by stream
        written = self.stream.WriteBytes("b9", dataWrite)

        # issue spi cmd
        cmd = f"i2cwr(b9, b8)"
        self.transport.WriteCommand(cmd)
        self.transport.ReadResponse()

        # use stream to read data to b8
        read = self.stream.ReadBytes("b8", dataRead)

        # return true since we can't check status if Asio(1)
        return (written == countWrite) and (read == countRead)

    
    
    

