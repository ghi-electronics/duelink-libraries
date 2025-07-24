from enum import Enum
from DUELink.SerialInterface import SerialInterface
from DUELink.Stream import StreamController

class OtpController:   

    def __init__(self, serialPort:SerialInterface, stream:StreamController):
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
        ret = self.serialPort.ReadResponse()

        return ret.success

    def OtpR(self, address: int)->int:
        cmd = f"OtpR({address})"
        self.serialPort.WriteCommand(cmd)
        ret = self.serialPort.ReadResponse()

        if ret.success:            
            try:
                value = int(ret.response)
                return value
            except:
                pass

        return -1
        
        




       



