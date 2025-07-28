
class OtpController:   

    def __init__(self, serialPort, stream):
        self.serialPort = serialPort
        self.stream = stream

    def OtpW(self, address: int, data: bytes)->bool:
        count = len(data)
        # declare b9 array
        cmd = f"dim b9[{count}]"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        # write data to b9
        ret = self.stream.WriteBytes("b9",data)

        # write b9 to dmx
        cmd = f"OtpW({address},b9)"
        self.serialPort.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()

        return r

    def OtpR(self, address: int)->int:
        cmd = f"OtpR({address})"
        self.serialPort.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()

        if r:            
            try:
                value = int(s)
                return value
            except:
                pass

        return -1
        
        




       



