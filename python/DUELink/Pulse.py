from DUELink.SerialInterface import SerialInterface

class PulseController:
    def __init__(self, serialPort:SerialInterface):
        self.serialPort = serialPort

    def Set(self, pin, pulseCount, pulseDuration):
        if pin < 0 or pin >= self.serialPort.DeviceConfig.MaxPinIO:
            raise ValueError('Invalid pin')    

        cmd = 'pulse({}, {},{} )'.format(pin, pulseCount, pulseDuration)
        
        self.serialPort.WriteCommand(cmd)

        response = self.serialPort.ReadRespone()

        return response.success