class HudimityController:
    def __init__(self, serialPort):
        self.serialPort = serialPort
        self.Dht11 = 11
        self.Dht12 = 12
        self.Dht21 = 21
        self.Dht22 = 22

    def Read(self, pin: int, sensortype: int) -> float:
        cmd = f"print(humidity({pin},{sensortype}))"
        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadRespone()
        return res.success
