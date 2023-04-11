from DUE.SerialInterface import SerialInterface

class AnalogController:
    def __init__(self, serialPort:SerialInterface):
        self.serialPort = serialPort

    def Read(self, pin):

        if pin < 0 or pin >= self.serialPort.DeviceConfig.MaxPinAnalog:
            raise ValueError("Invalid pin")

        cmd = "print(aread({0}))".format(str(pin))

        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadRespone()

        if res.success:
            try:
                return int(res.respone)
            except:
                pass

        return -1
