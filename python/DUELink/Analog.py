from DUELink.SerialInterface import SerialInterface

class AnalogController:
    def __init__(self, serialPort:SerialInterface):
        self.serialPort = serialPort
        self.Fixed_Frequency = 50

    def VoltRead(self, pin):

        if pin not in self.serialPort.DeviceConfig.AnalogPins:
            raise ValueError("Invalid pin. Enter a valid analog pin.")

        cmd = "vread({0})".format(pin)

        self.serialPort.WriteCommand(cmd)

        ret = self.serialPort.ReadResponse()

        if ret.success:
            try:
                return float(ret.response)
            except:
                pass

        return -1
    
    def Read(self, pin):

        if pin not in self.serialPort.DeviceConfig.AnalogPins:
            raise ValueError("Invalid pin. Enter a valid analog pin.")

        cmd = "aread({0})".format(pin)

        self.serialPort.WriteCommand(cmd)

        ret = self.serialPort.ReadResponse()

        if ret.success:
            try:
                return float(ret.response)
            except:
                pass

        return -1
    
    def Write(self, pin, duty_cycle):
        
        if pin not in self.serialPort.DeviceConfig.PWMPins: # Led
            raise ValueError('Invalid pin. Enter a valid pwm pin.')

        if duty_cycle < 0 or duty_cycle > 1:
            raise ValueError('Duty cycle must be in the range 0..1')

        cmd = f'awrite({pin}, {duty_cycle})'
        self.serialPort.WriteCommand(cmd)

        ret = self.serialPort.ReadResponse()

        return ret.success
    
    def ReadVCC(self):
        cmd = f"readvcc()"
        self.serialPort.WriteCommand(cmd)
        ret = self.serialPort.ReadResponse()

        if ret.success:
            try:
                return float(ret.response)
            except:
                pass

        return -1
