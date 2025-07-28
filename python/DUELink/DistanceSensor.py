from DUELink.SerialInterface import SerialInterface

class DistanceSensorController:
    def __init__(self, serialPort:SerialInterface):
        self.serialPort = serialPort

    def Read(self, trigPin, echoPin)->float:
        cmd = f'dist({trigPin},{echoPin})'
        self.serialPort.WriteCommand(cmd)

        ret = self.serialPort.ReadResponse()

        if ret.success:
            try:
                return float(ret.response)
            except ValueError:
                pass

        return 0
