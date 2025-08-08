class UartController:
    def __init__(self, serialPort, stream):
        self.serialPort = serialPort
        self.stream = stream

    def Configuration(self, baudrate: int, rx_buf_size: int)->bool:
        cmd = "SerCfg({0}, {1})".format(baudrate, rx_buf_size)
        self.serialport.WriteCommand(cmd)
        r,s = self.serialport.ReadResponse()
        return r

    def WriteByte(self, data: int)->bool:
        cmd = "SerWr({})".format(data)
        self.serialport.WriteCommand(cmd)
        r,s = self.serialport.ReadResponse()
        return r        
    
    def WriteBytes(self, data: bytes)->int:
        count = len(data)
        cmd = f"dim b9[{count}]"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        written = self.stream.WriteBytes("b9", data)

        self.serialport.WriteCommand("SerWrs(b9)")
        r,s = self.serialPort.ReadResponse()

        if (r):
            return written

        return 0
    
    def ReadByte(self):        
        self.serialport.WriteCommand("SerRd()")
        r,s = self.serialport.ReadResponse()
        if r:
            try:
                data = int(s)
                return data
            except:
                pass
        return 0
    
    def ReadBytes(self, data: bytearray, timeout_ms: int)->int:
        count = len(data)
        cmd = f"dim b9[{count}]"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        cmd = f"SerRds(b9, {timeout_ms})"
        self.serialport.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()

        read = self.stream.ReadBytes("b9",data )

        if (r):
            return read

        return 0

    def BytesToRead(self)->int:        
        self.serialport.WriteCommand("SerB2R()")
        r,s = self.serialport.ReadResponse()
        if r:
            try:
                ready = int(s)
                return ready
            except:
                pass
        return 0
    
    def Discard(self)->bool:        
        self.serialport.WriteCommand("SerDisc()")
        r,s = self.serialport.ReadResponse()
        
        return r
    

    
