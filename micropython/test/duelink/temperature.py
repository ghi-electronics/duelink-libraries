 

class TemperatureController:
    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Read(self, pin: int, sensortype: int) -> float:
        cmd = f"temp({pin},{sensortype})"
        self.serialPort.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()
        return float(s)
        
