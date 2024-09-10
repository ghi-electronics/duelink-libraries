from DUELink.SerialInterface import SerialInterface

class PulseController:
    def __init__(self, serialPort:SerialInterface):
        self.serialPort = serialPort

    def Set(self, pin, stepCount, delay_us):
        if pin < 0 or pin >= self.serialPort.DeviceConfig.MaxPinIO:
            raise ValueError('Invalid pin')    

        cmd = 'pulse({}, {},{} )'.format(pin, stepCount, delay_us)
        
        self.serialPort.WriteCommand(cmd)

        response = self.serialPort.ReadRespone()

        return response.success