
class SoundController:    

    def __init__(self, transport):
        self.transport = transport

    def Beep(self, pin, freq, duration):
        self.transport(f"beep({pin},{freq},duration)")
