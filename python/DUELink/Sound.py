from typing import List
from DUELink.SerialInterface import SerialInterface

class SoundController:
    def __init__(self, serialPort:SerialInterface):
        self.serialPort = serialPort

    def Beep(self, pin:int, frequency:int, duration:int)->bool:

        if pin < 0 or pin > self.serialPort.DeviceConfig.MaxPinIO:
            raise ValueError("Invalid pin")
        #if frequency < 0 or frequency > 10000:
            #raise ValueError("Frequency is within range[0,10000] Hz")
        # if duration < 0 or duration > 1000:
        #     raise ValueError("duration is within range[0,1000] millisecond")
        
        cmd = "beep({0}, {1}, {2})".format(pin, frequency, duration)
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success
    
    def MelodyPlay(self, pin: int, notes: List[float]) -> bool:

        if pin < 0 or pin not in self.serialPort.DeviceConfig.PWMPins:
            raise ValueError("Invalid pin")
        if not isinstance(notes, list) and all(isinstance(i, float) for i in notes):
            raise ValueError("Notes is not the correct datatype. Enter a list of floats for melody notes.")

        for note in notes:
            if note < 0 or note > 10000:
                raise ValueError("Note Frequency is within range[0,10000] Hz")
        
        cmd = "MelodyP({0}, {{{1}}})".format(pin, ", ".join(map(str, notes)))
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        
        return res.success

    def MelodyStop(self, pin: int):

        if pin < 0 or pin not in self.serialPort.DeviceConfig.PWMPins:
            raise ValueError("Invalid pin")
        
        cmd = "MelodyS({0})".format(pin)
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success
        
