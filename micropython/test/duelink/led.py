
class LedController:    

    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Set(self, high, low, count):
        self.serialPort.execute(f"statled({high},{low},{count})")        

