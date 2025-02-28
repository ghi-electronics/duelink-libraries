from DUELink.SerialInterface import SerialInterface

class ServoController:
    def __init__(self, serialPort:SerialInterface):
        self.serialPort = serialPort

    def Set(self, pin, position):
        if pin < 0 or pin >= self.serialPort.DeviceConfig.MaxPinIO or pin not in self.serialPort.DeviceConfig.PWMPins:
            raise ValueError('Invalid pin. Please enter a valid PWM pin.')
        if position < 0 or position > 180:
            raise ValueError('Position must be in the range 0..180')

        cmd = 'servost({}, {})'.format(pin, position)
        self.serialPort.WriteCommand(cmd)

        response = self.serialPort.ReadRespone()

        return response.success
