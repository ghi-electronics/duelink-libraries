class UartController:
    def __init__(self, serial_port):
        self.serial_port = serial_port

    def Enable(self, baudrate):
        cmd = "uartinit({})".format(baudrate)
        self.serial_port.WriteCommand(cmd)
        res = self.serial_port.ReadRespone()
        return res.success

    def Write(self, data):
        cmd = "uartwrite({})".format(data)
        self.serial_port.WriteCommand(cmd)
        res = self.serial_port.ReadRespone()
        return res.success

    def BytesToRead(self):
        cmd = "x=uartcount():print(x)"
        self.serial_port.WriteCommand(cmd)
        res = self.serial_port.ReadRespone()
        if res.success:
            try:
                ready = int(res.respone)
                return ready
            except:
                pass
        raise Exception("BytesToRead error!")

    def Read(self):
        cmd = "x=uartread():print(x)"
        self.serial_port.WriteCommand(cmd)
        res = self.serial_port.ReadRespone()
        if res.success:
            try:
                data = int(res.respone)
                return data
            except:
                pass
        raise Exception("Uart receving error!")
