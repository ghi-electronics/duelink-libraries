from DUELink.SerialInterface import SerialInterface

class DistanceSensorController:
    def __init__(self, serialPort:SerialInterface):
        self.serialPort = serialPort

    def Read(self, trigPin, echoPin)->float:

        if trigPin < 0 or trigPin > self.serialPort.DeviceConfig.MaxPinIO:
            raise ValueError('Invalid pin')

        if echoPin < 0 or echoPin > self.serialPort.DeviceConfig.MaxPinIO:
            raise ValueError('Invalid pin')

        cmd = f'dist({trigPin},{echoPin})'
        self.serialPort.WriteCommand(cmd)

        ret = self.serialPort.ReadResponse()

        if ret.success:
            try:
                return float(ret.response)
            except ValueError:
                pass

        return -1
