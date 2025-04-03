
class SystemController:    

    def __init__(self, transport):
        self.transport = transport

    def Info(self, code):
        r, s = self.transport.execute(f"info({code})")
        if s:
            return float(r)
        return 0
    
    def Reset(self, option):
        self.transport.execute(f"reset({option})")
