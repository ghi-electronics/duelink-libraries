from enum import Enum
from DUELink.SerialInterface import SerialInterface


class PulseController:   

    def __init__(self, serialPort:SerialInterface):
        self.serialPort = serialPort


    def PulseIn(self, pin: int, state: int, timeout_ms: int)->int:                
        cmd = f"PulseIn({pin}, {state}, {timeout_ms})"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        ret = self.serialPort.ReadResponse()

        if ret.success:            
            try:
                value = int(ret.response)
                return value
            except:
                pass

        return 0

        
        




       



