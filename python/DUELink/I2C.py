from typing import Optional
from DUELink.SerialInterface import SerialInterface
from DUELink.Stream import StreamController

class I2cController:
    def __init__(self, serialPort:SerialInterface, stream:StreamController):
        self.serialPort = serialPort
        self.stream = stream
        self.baudrate = 400

    def Configuration(self, baudrate):

        if not isinstance(baudrate, int):
            raise ValueError("Enter an integer for the baudrate.")

        self.baudrate = baudrate

        cmd = f"i2ccfg({baudrate})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success

    def WriteRead(self, address: int, dataWrite: bytes, dataRead: bytearray) -> bool:
        countWrite = len(dataWrite)
        countRead = len(dataRead)
        

        # declare b9 to write    
        cmd = f"dim b9[{countWrite}]"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        # declare b8 to read
        cmd = f"dim b8[{countRead}]"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        # write data to b9 by stream
        self.stream.WriteBytes("b9", dataWrite)

        # issue i2cwr cmd
        cmd = f"i2cwr({address}, b9, b8)"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        # use stream to read data to b8
        self.stream.ReadBytes("b8", dataRead)

        # return true since we can't check status if Asio(1)
        return True
