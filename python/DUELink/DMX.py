from enum import Enum
from DUELink.SerialInterface import SerialInterface
from DUELink.Stream import StreamController

class DMXController:   

    def __init__(self, serialPort:SerialInterface, stream:StreamController):
        self.serialPort = serialPort
        self.stream = stream

    def DmxW(self, channel_data: bytes):
        count = len(channel_data)
        # declare b9 array
        cmd = f"dim b9[{count}]"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        # write data to b9
        ret = self.stream.WriteBytes("b9",channel_data)

        # write b9 to dmx
        self.serialPort.WriteCommand("DmxW(b9)")
        self.serialPort.ReadResponse()

    def DmxR(self, channel: int)->int:
        cmd = f"DmxR({channel})"
        self.serialPort.WriteCommand(cmd)
        ret = self.serialPort.ReadResponse()

        if ret.success:            
            try:
                value = int(ret.response)
                return value
            except:
                return -1

        return -1
    
    def DmxRdy(self)->int:
        cmd = f"DmxRdy()"
        self.serialPort.WriteCommand(cmd)
        ret = self.serialPort.ReadResponse()

        if ret.success:            
            try:
                value = int(ret.response)
                return value
            except:
                return 0

        return 0
    
    def DmxU(self):
        cmd = f"DmxU()"
        self.serialPort.WriteCommand(cmd)
        ret = self.serialPort.ReadResponse()
        




       



