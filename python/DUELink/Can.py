from DUELink.SerialInterface import SerialInterface

class CanMessage:
    def __init__(self, id:int, extended:bool, remoteRequest:bool, data:bytearray, offset:int, length:int):
        if (length <=0 or length > 8):
            raise ValueError(f'Length {length} invalid')
        
        self.Id = id
        self.Extended = extended
        self.RemoteRequest = remoteRequest
        self.Length = length
        self.Data = [0]*8
        for i in range (offset, offset + length):
            self.Data[i-offset] = data[i]
            


class CanController:
    def __init__(self, serialPort:SerialInterface):
        self.serialPort = serialPort

    def Initialize(self, baudrate):
        baudrate_string = ""

        if (baudrate == 100_000 or baudrate == 250_000 or baudrate == 500_000 or baudrate == 1000_000):
            baudrate_string = str(baudrate)
        else:
            raise ValueError('baudrate must be 100_000, 250_000, 500_000, 1000_000')

        cmd = 'caninit({})'.format(baudrate_string)
        
        self.serialPort.WriteCommand(cmd)

        response = self.serialPort.ReadRespone()

        return response.success
    
    def InitializeExt(self, phase1,  phase2, prescaler, synchronizationJumpWidth):
        cmd = 'caninit({},{},{},{})'.format(phase1, phase2,prescaler,synchronizationJumpWidth)

        self.serialPort.WriteCommand(cmd)
        response = self.serialPort.ReadRespone()

        return response.success

    def Available(self):
        cmd = 'log(canavailable())'

        self.serialPort.WriteCommand(cmd)
        response = self.serialPort.ReadRespone()

        if response.success:
            try:
                return int(response.respone)
            except:
                pass

        return -1
    
    def WriteMessage(self, message:CanMessage)-> bool:
        data = [0]*16

        data[0] = ((message.Id >> 24) & 0xFF)
        data[1] = ((message.Id >> 16) & 0xFF)
        data[2] = ((message.Id >> 8) & 0xFF)
        data[3] = ((message.Id >> 0) & 0xFF)

        if (message.Extended == False):
            data[4] = 0
        else:
            data[4] = 1

        if (message.RemoteRequest == False):
            data[5] = 0
        else:
            data[5] = 1
        data[6] = message.Length
        data[7] = 0 

        for i in range(0, 8):
            data[8 + i] = message.Data[i]

        cmd = 'canwritestream()'

        self.serialPort.WriteCommand(cmd)
        
        response = self.serialPort.ReadRespone()

        if response.success == False:
           raise Exception('CAN write error')
        
        self.serialPort.WriteRawData(data, 0, len(data))

        response = self.serialPort.ReadRespone()

        return response.success
    
    def ReadMessage(self) -> CanMessage:
        cmd = 'canreadstream()'

        self.serialPort.WriteCommand(cmd)
        
        response = self.serialPort.ReadRespone()
    
        if response.success == False:
           raise Exception('CAN read error')
        
        data = [0]*16
        
        self.serialPort.ReadRawData(data, 0, len(data))

        id = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3]

        extendId = False
        rtr = False

        if data[4] > 0:
            extendId = True
        if data[5] > 0:
            rtr = True
    

        message = CanMessage(id, extendId, rtr, data, 8, data[6])

        return message
                

        