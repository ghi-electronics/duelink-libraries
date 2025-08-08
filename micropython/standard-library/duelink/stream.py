import time
class StreamController:    

    def __init__(self, serialPort):
        self.serialPort = serialPort        

    def WriteSpi(self, dataWrite: bytes)->int:
        count = len(dataWrite)

        cmd = f"strmspi({count})"        
        self.serialPort.WriteCommand(cmd)
        
        # wait for prompt &
        prompt = 0
        while True:            
            data = self.serialPort.ReadByte()
            if data[0] == ord('&'):
                prompt = data[0]
                break
        
        if prompt != ord('&'):
            raise Exception("Invalid or no responses")
        
        # ready to write data
        self.serialPort.WriteRawData(dataWrite,0, count)
        
        # read x\r\n>
        r,s = self.serialPort.ReadResponse()
        
        if r == True:
            try:
                return int(s)
            except:
                return 0                
        
        return 0
    
    def WriteBytes(self, arr: str, dataWrite: bytes)->int:
        count = len(dataWrite)

        # declare b1 array
        cmd = f"strmwr({arr},{count})"       
        self.serialPort.WriteCommand(cmd)
        
        # wait for prompt &
        prompt = 0
        startms = time.ticks_ms()
        while (time.ticks_ms() - startms < self.serialPort.ReadTimeout):            
            data = self.serialPort.ReadByte()
            if data[0] == ord('&'):
                prompt = data[0]
                break
            
            
        
        if prompt != ord('&'):
            raise Exception("Invalid or no responses")
        
        # ready to write data
        self.serialPort.WriteRawData(dataWrite,0, count)
        
        # read x\r\n>
        r,s = self.serialPort.ReadResponse()
        if r == True:
            try:
                return int(s)
            except:
                return 0                
        
        return 0
    
    def ReadBytes(self, arr: str, dataRead: bytes):
        if dataRead is None or dataRead == 0:
            return 0
        count = len(dataRead)

        # declare b1 array
        cmd = f"strmrd({arr},{count})"
        self.serialPort.WriteCommand(cmd)

        # wait for prompt &
        prompt = 0
        while True:            
            data = self.serialPort.ReadByte()
            if data[0] == ord('&'):
                prompt = data[0]
                break
        
        if prompt != ord('&'):
            raise Exception("Invalid or no responses")
        
        # ready to read data
        self.serialPort.ReadRawData(dataRead,0, count)

        # read x\r\n> (asio(1) not return this)
        r,s = self.serialPort.ReadResponse()
        
        if r == True:
            try:
                return int(s)
            except:
                return 0                
        
        return 0
        
            
            
            
            
            
            
            
        
    