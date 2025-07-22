from enum import Enum
from DUELink.SerialInterface import SerialInterface
from DUELink.Stream import StreamController

class RtcController:   

    def __init__(self, serialPort:SerialInterface, stream:StreamController):
        self.serialPort = serialPort
        self.stream = stream

    def RtcW(self, rtc_timedate: bytes)->bool:
        count = len(rtc_timedate)
        # declare b9 array
        cmd = f"dim b9[{count}]"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        # write data to b9
        ret = self.stream.WriteBytes("b9",rtc_timedate)

        # write b9 to dmx
        self.serialPort.WriteCommand("RtcW(b9)")
        ret = self.serialPort.ReadResponse()

        return ret.success

    def RtcR(self, rtc_timedate: bytearray)->int:
        count = len(rtc_timedate)
        # declare b9 array
        cmd = f"dim b9[{count}]"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        cmd = f"RtcR(b9)"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        ret = self.stream.ReadBytes("b9",rtc_timedate)

        return ret
    
    def RtcShow(self)->bool:
        self.serialPort.WriteCommand("OtpR(0)")
        ret = self.serialPort.ReadResponse()

        return ret.success
        
        




       



