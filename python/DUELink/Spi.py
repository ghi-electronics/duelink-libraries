from typing import Optional

import time
from DUELink.SerialInterface import SerialInterface

class SpiController:
    def __init__(self, serialPort:SerialInterface):
        self.serialPort = serialPort

    # def Write(self, dataWrite: bytes, offset: int = 0, length: Optional[int] = None, chipselect: int = -1) -> bool:
    #     if length is None:
    #         length = len(dataWrite)

    #     return self.WriteRead(dataWrite, offset, length, None, 0, 0, chipselect)

    def Configuration(self, mode, frequency):
        
        if not isinstance(mode, int) or mode not in {0,1,2,3}:
            raise ValueError("Invalid mode. Enter an integer between 0-3.")
        
        if not isinstance(frequency, int) or (not 200 <= frequency <= 24000):
            raise ValueError("Invalid frequency. Enter an integer between 200-24000.")
    
        cmd = f"spicfg({mode}, {frequency})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success
    
    def WriteByte(self, data: int):
        
        if not isinstance(data, int) or (not 0 <= data <= 255):
            raise ValueError("Enter only one byte as an integer into the data parameter.")
    
        cmd = f"spiwr({data})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadResponse()
        return res.success

    # def Read(self, dataRead: bytearray, offset: int = 0, length: Optional[int] = None, chipselect: int = -1) -> bool:
    #     if length is None:
    #         length = len(dataRead)

    #     return self.WriteRead(None, 0, 0, dataRead, offset, length, chipselect)

    def WriteRead(self, dataWrite: Optional[bytes], dataRead: Optional[bytes]) -> bool:




        cmd = f"spiwrs({dataWrite},{dataRead})"
        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadResponse()

        # while countWrite > 0 or countRead > 0:
        #     num = countRead

        #     if countWrite < countRead:
        #         num = countWrite

        #     if countWrite == 0 :
        #         num = countRead

        #     if countRead == 0 :
        #         num = countWrite

        #     if (num > self.serialPort.TransferBlockSizeMax) :
        #         num = self.serialPort.TransferBlockSizeMax

        #     if countWrite > 0:
        #         self.serialPort.WriteRawData(dataWrite, offsetWrite, num)
        #         offsetWrite += num
        #         countWrite -= num

        #     if countRead > 0:
        #         self.serialPort.ReadRawData(dataRead, offsetRead, num)
        #         offsetRead += num
        #         countRead -= num            

        return res.success
    
    
    
    # def Configuration(self,mode: int,  frequencyKHz: int)-> bool:
    #     if mode > 3 or mode < 0:
    #         raise ValueError("Mode must be in range 0...3.")
        
    #     if frequencyKHz < 200  or frequencyKHz > 20000:
    #         raise ValueError("FrequencyKHz must be in range 200KHz to 20MHz.")
        
    #     cmd = f"palette({mode},{frequencyKHz})"

    #     self.serialPort.WriteCommand(cmd)

    #     res = self.serialPort.ReadResponse()
    #     return res.success
    

