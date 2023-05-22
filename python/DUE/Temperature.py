class TemperatureController:
    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Read(self, pin: int, sensortype: int) -> float:
        cmd = f"print(temp({pin},{sensortype}))"
        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadRespone()
        return res.success
