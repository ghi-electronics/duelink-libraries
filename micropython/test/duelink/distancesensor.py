# CT: 05/26/2025 - Tested
class DistanceSensorController:    

    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Read(self, trigPin, echoPin)->float:
        cmd = f'dist({trigPin},{echoPin})'
        self.serialPort.WriteCommand(cmd)

        r,s = self.serialPort.ReadResponse()

        if r == True:
            try:
                return float(ret.response)
            except ValueError:
                pass

        return 0
