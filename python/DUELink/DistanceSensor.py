from DUE.SerialInterface import SerialInterface

class DistanceSensorController:
    def __init__(self, serialPort:SerialInterface):
        self.serialPort = serialPort

    def Read(self, pulsePin, echoPin):

        if pulsePin < 0 or pulsePin >= self.serialPort.DeviceConfig.MaxPinIO:
            raise ValueError('Invalid pin')

        if echoPin < 0 or echoPin >= self.serialPort.DeviceConfig.MaxPinIO:
            raise ValueError('Invalid pin')

        cmd = f'print(distance({pulsePin},{echoPin}))'
        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadRespone()

        if res.success:
            try:
                distance = int(res.respone)
                return distance
            except ValueError:
                pass

        return -1
