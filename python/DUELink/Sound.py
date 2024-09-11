from DUELink.SerialInterface import SerialInterface

class SoundController:
    def __init__(self, serialPort:SerialInterface):
        self.serialPort = serialPort

    def Beep(self, pin:int, frequency:int, duration:int)->bool:
        if frequency < 0 or frequency > 10000:
            raise ValueError("Frequency is within range[0,10000] Hz")
        if duration < 0 or duration > 1000:
            raise ValueError("duration is within range[0,1000] millisecond")
        if pin == 'p' or pin == 'P':
            pin = 0x70
        
        cmd = "beep({0}, {1}, {2})".format(pin, frequency, duration)
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success   