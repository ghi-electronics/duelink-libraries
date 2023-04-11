from DUE.SerialInterface import SerialInterface

class PwmController:

    def __init__(self, serialPort:SerialInterface):
        self.serialPort = serialPort
        self.Fixed_Frequency = 50

    def Set(self, pin, duty_cycle):
        if pin < 0 or pin >= self.serialPort.DeviceConfig.MaxPinIO:
            raise ValueError('Invalid pin')

        if duty_cycle < 0 or duty_cycle > 1000:
            raise ValueError('Duty cycle must be in the range 0..1000')

        cmd = f'awrite({pin}, {duty_cycle})'
        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadRespone()
        if res.success:
            return True

        return False
