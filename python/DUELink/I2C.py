from typing import Optional

class I2cController:
    def __init__(self, serialPort) -> None:
        self.serialPort = serialPort
        self.baudrate = 400

    def Write(self, address: int, data: bytes, offset: Optional[int] = 0, length: int = None) -> bool:
        if length is None:
            length = len(data)
        
        return self.WriteRead(address, data, length, None, 0, 0)

    def Read(self, address: int, data: bytearray, offset: Optional[int] = 0, length: int = None) -> bool:
        if length is None:
            length = len(data)

        return self.WriteRead(address, None, 0, 0, data, offset, length)

    def Configuration(self, baudrate):

        if not isinstance(baudrate, int):
            raise ValueError("Enter an integer for the baudrate.")

        self.baudrate = baudrate

        cmd = f"i2ccfg({baudrate})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success

    def WriteRead(self, address: int, dataWrite: Optional[bytes], countWrite: int, dataRead: Optional[bytearray], countRead: int) -> bool:
        if (dataWrite is None and dataRead is None) or (countWrite == 0 and countRead == 0):
            raise ValueError("At least one of dataWrite or dataRead must be specified")
        
        if dataWrite is None and countWrite != 0:
            raise Exception("dataWrite null but countWrite not zero")

        if dataRead is None and countRead != 0:
            raise Exception("dataRead null but countRead not zero")
        
        if dataRead is None:
            dataRead = 0
        
        if dataWrite is None:
            dataWrite = 0
        
        cmd = f"i2cwr({address},{dataWrite},{countWrite},{dataRead},{countRead})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success