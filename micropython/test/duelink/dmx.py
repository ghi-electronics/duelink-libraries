
class DMXController:    

    def __init__(self, serialPort,stream):
        self.serialPort = serialPort
        self.stream = stream

    def DmxW(self, channel_data: bytes)->bool:
        count = len(channel_data)
        # declare b9 array
        cmd = f"dim b9[{count}]"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        # write data to b9
        ret = self.stream.WriteBytes("b9",channel_data)

        # write b9 to dmx
        self.serialPort.WriteCommand("DmxW(b9)")
        r,s = self.serialPort.ReadResponse()

        return r


    def DmxR(self, channel: int)->int:
        cmd = f"DmxR({channel})"
        self.serialPort.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()

        if r:            
            try:
                value = int(s)
                return value
            except:
                return -1

        return -1
    
    def DmxRdy(self)->int:
        cmd = f"DmxRdy()"
        self.serialPort.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()

        if r:            
            try:
                value = int(s)
                return value
            except:
                return 0

        return 0
    
    def DmxU(self)->bool:
        cmd = f"DmxU()"
        self.serialPort.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()

        return r 
