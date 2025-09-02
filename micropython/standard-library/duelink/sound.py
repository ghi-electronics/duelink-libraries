import duelink as DL

class SoundController:    
    def __init__(self, serialPort):
        self.transport = serialPort

    def Beep(self, pin, frequency, duration_ms):
        cmd = "beep({0}, {1}, {2})".format(pin, frequency, duration)
        self.transport.WriteCommand(cmd)
        r,s = self.transport.ReadResponse()
        return r
        
    
    def MelodyPlay(self, pin, notes):
        arr = ""
        if isinstance(notes, (list)):
            arr = DL.build_floatarray(notes)
        elif isinstance(notes, str):
            arr = notes
        else:
            t = type(notes)
            raise Exception("Invalid notes type '{t}'")

        self.transport.WriteCommand(f"melodyp({pin},{arr})")
        r,s = self.transport.ReadResponse()
        return r
        
    def MelodyStop(self, pin):
        cmd = "MelodyS({0})".format(pin)
        self.transport.WriteCommand(cmd)
        r,s = self.transport.ReadResponse()
        return r
        


