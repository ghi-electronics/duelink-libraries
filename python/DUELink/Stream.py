from enum import Enum
import time
from DUELink.SerialInterface import SerialInterface
import struct

class StreamController:   

    def __init__(self, serialPort:SerialInterface):
        self.serialPort = serialPort

    def WriteSpi(self, dataWrite: bytes):
        count = len(dataWrite)

        # declare b1 array
        cmd = f"strmspi({count})"
        self.serialPort.WriteCommand(cmd)

    def WriteBytes(self, arr: str, dataWrite: bytes):
        count = len(dataWrite)

        # declare b1 array
        cmd = f"strmwr({arr},{count})"
        self.serialPort.WriteCommand(cmd)

        # wait for prompt &
        while self.serialPort.BytesToRead() == 0:
            time.sleep(0.001)
        
        prompt = self.serialPort.ReadByte()

        if prompt != '&':
            raise Exception("Invalid response package")
        
        # ready to write data
        self.serialPort.WriteRawData(dataWrite,0, count)

        # read x\r\n> (asio(1) not return this)
        ret = self.serialPort.ReadResponse()

        if ret.success:
            try:
                return int(ret.response)
            except:
                return 0                
        
        return 0
    
    def WriteFloats(self, arr: str, dataWrite: float):
        count = len(dataWrite)

        # declare b1 array
        cmd = f"strmwr({arr},{count})"
        self.serialPort.WriteCommand(cmd)

        # wait for prompt &
        while self.serialPort.BytesToRead() == 0:
            time.sleep(0.001)
        
        prompt = self.serialPort.ReadByte()

        if prompt != '&':
            raise Exception("Invalid response package")
        
        # ready to write data
        for i in range (0, count):
            float_bytes = struct.pack('>f', dataWrite[i])
            float_bytes_lsb = float_bytes[::-1]
            self.serialPort.WriteRawData(float_bytes_lsb,0, 4)        

        # read x\r\n> (asio(1) not return this)
        ret = self.serialPort.ReadResponse()

        if ret.success:
            try:
                return int(ret.response)
            except:
                return 0                
        
        return 0
    
    def ReadBytes(self, arr: str, dataRead: bytes):
        count = len(dataRead)

        # declare b1 array
        cmd = f"strmrd({arr},{count})"
        self.serialPort.WriteCommand(cmd)

        # wait for prompt &
        while self.serialPort.BytesToRead() == 0:
            time.sleep(0.001)
        
        prompt = self.serialPort.ReadByte()

        if prompt != '&':
            raise Exception("Invalid response package")
        
        # ready to read data
        self.serialPort.ReadRawData(dataRead,0, count)

        # read x\r\n> (asio(1) not return this)
        ret = self.serialPort.ReadResponse()

        if ret.success:
            try:
                return int(ret.response)
            except:
                return 0                
        
        return 0
    
    def ReadFloats(self, arr: str, dataRead: float):
        count = len(dataRead)

        # declare b1 array
        cmd = f"strmrd({arr},{count})"
        self.serialPort.WriteCommand(cmd)

        # wait for prompt &
        while self.serialPort.BytesToRead() == 0:
            time.sleep(0.001)
        
        prompt = self.serialPort.ReadByte()

        if prompt != '&':
            raise Exception("Invalid response package")
        
        # ready to read data
        raw_bytes = bytearray(4)
        for i in range (0, count):
            self.serialPort.ReadRawData(raw_bytes,0, 4)
            raw_bytes_lsb = raw_bytes[::-1]
            dataRead[i] = struct.unpack('f', raw_bytes)[0]        

        # read x\r\n> (asio(1) not return this)
        ret = self.serialPort.ReadResponse()

        if ret.success:
            try:
                return int(ret.response)
            except:
                return 0                
        
        return 0



        





        
    
       
