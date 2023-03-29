from Due.Const import MAX_IO_ANALOG

class AnalogController:
    def __init__(self, serialPort):
        self.serialPort = serialPort

    def read(self, pin):

        if pin < 0 or pin >= MAX_IO_ANALOG:
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
