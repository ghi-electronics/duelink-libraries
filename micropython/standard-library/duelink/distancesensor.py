# CT: 05/26/2025 - Tested
class DistanceSensorController:    

    def __init__(self, serialPort):
        self.transport = serialPort

    def Read(self, trigPin, echoPin)->float:
        cmd = f'dist({trigPin},{echoPin})'
        self.transport.WriteCommand(cmd)

        r,s = self.transport.ReadResponse()

        if r == True:
            try:
                return float(ret.response)
            except ValueError:
                pass

        return 0
