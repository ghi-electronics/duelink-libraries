class PwmController:
    MAX_IO = 20

    def __init__(self, serial_port):
        self.serial_port = serial_port
        self.Fixed_Frequency = 50

    def Set(self, pin, duty_cycle):
        if pin < 0 or pin >= self.MAX_IO:
            raise ValueError('Invalid pin')

        if duty_cycle < 0 or duty_cycle > 1000:
            raise ValueError('Duty cycle must be in the range 0..1000')

        cmd = f'awrite({pin}, {duty_cycle})'
        self.serial_port.WriteLine(cmd)

        res = self.serial_port.ReadRespone()
        if res.success:
            return True

        return False
