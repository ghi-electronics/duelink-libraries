
class ServoController:
    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Set(self, pin, position)->bool:       
        if position < 0 or position > 180:
            raise ValueError('Position must be in the range 0..180')

        cmd = 'servost({}, {})'.format(pin, position)
        self.serialPort.WriteCommand(cmd)

        r,s = self.serialPort.ReadResponse()

        return r
