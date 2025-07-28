class RtcController:   

    def __init__(self, serialPort, stream):
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
        r,s = self.serialPort.ReadResponse()

        return r

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
        r,s = self.serialPort.ReadResponse()

        return r
        
        




       



