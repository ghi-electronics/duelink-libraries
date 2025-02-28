from DUELink.SerialInterface import SerialInterface

class AnalogController:
    def __init__(self, serialPort:SerialInterface):
        self.serialPort = serialPort
        self.Fixed_Frequency = 50

    def VoltageRead(self, pin):

        if pin not in self.serialPort.DeviceConfig.AnalogPins:
            raise ValueError("Invalid pin. Enter a valid analog pin.")

        cmd = "vread({0})".format(pin)

        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadRespone()

        if res.success:
            try:
                return float(res.respone)
            except:
                pass

        return -1
    
    def Write(self, pin, duty_cycle):
        
        if pin not in self.serialPort.DeviceConfig.PWMPins: # Led
            raise ValueError('Invalid pin. Enter a valid pwm pin.')

        if duty_cycle < 0 or duty_cycle > 1:
            raise ValueError('Duty cycle must be in the range 0..1')

        cmd = f'pwrite({pin}, {duty_cycle})'
        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadRespone()

        if res.success:
            return True

        return False
