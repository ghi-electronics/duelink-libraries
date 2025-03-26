
class LedController:    

    def __init__(self, transport):
        self.transport = transport

    def Set(self, high, low, count):
        self.transport.execute(f"led({high},{low},{count})")        

