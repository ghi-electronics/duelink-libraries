from Due.Const import MAX_IO

class ServoMotoController:
    def __init__(self, serial_port):
        self.serial_port = serial_port

    def Set(self, pin, position):
        if pin < 0 or pin >= MAX_IO:
            raise ValueError('Invalid pin')
        if position < 0 or position > 180:
            raise ValueError('Position must be in the range 0..180')

        cmd = 'servoset({}, {})'.format(pin, position)
        self.serial_port.WriteLine(cmd)

        response = self.serial_port.ReadRespone()

        return response.success
