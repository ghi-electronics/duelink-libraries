import machine
import time
import struct

class I2CTransportController:
    def __init__(self, sda, scl, i2ccontroller=1, freq=400000, addr=0x52):
        self.i2c = machine.I2C(i2ccontroller, sda = sda, scl = scl, freq=freq)
        self.addr = addr
    
    def writeBytes(self, bytes):
        self.i2c.writeto(self.addr, array.array(bytes))
        
    def write(self, str):
        self.i2c.writeto(self.addr, str+"\n")
        
    def read(self, buf, timeout):
        startms = time.ticks_ms()
        bytesToRead = 0;
        i=0
        while (time.ticks_ms() - startms < timeout):
            bytes = self.i2c.readfrom(self.addr, 1)
            if bytes is not None and len(bytes) > 0:
                c = bytes[0]
                if c >= 0 and c <= 127:
                    bytesToRead=len(buf)-2
                    buf[i] = c
                    i = i + 1
                    break
        if bytesToRead > 0 and buf[0] != '>' and buf[0] != '&':
            bytes = self.i2c.readfrom(self.addr, bytesToRead)
            while (time.ticks_ms() - startms < timeout) and bytesToRead > 0:
                for c in bytes:
                    if c >= 0 and c <= 127:
                        buf[i] = c
                        i = i + 1
                        bytesToRead = bytesToRead - 1
                        if bytesToRead == 0:
                            break
    
    def execute(self, command):
        buf = bytearray(128)
        self.write(command)
        self.read(buf, 1000)
        return self.__getResponse(command, buf.decode("utf-8"))
        
    def __getResponse(self, command, response):
        cmdIdx = response.find(command)
        if cmdIdx == -1:
            cmdIdx = 0
        else:
            cmdIdx = len(command)+2 # +2 skip \r\n
        
        success = response[cmdIdx] != '!'
        if not success:
            cmdIdx = cmdIdx + 1
            
        if response[cmdIdx] == '>':
            return ("", success)
        
        endIdx = response.find("\r\n>", cmdIdx)
        if endIdx >= cmdIdx:
            return (response[cmdIdx:endIdx], success)
        
        return ("", success)
    
class UartTransportController:
    def __init__(self, id):
        self.ReadTimeout = 3000
        self.uart = machine.UART(id,115200)
        self.uart.init(115200, bits=8, parity=None, stop=1, timeout=1000)
        time.sleep(0.2)
        self.sync()
        
    def sync(self):
        # Synchronize is no longer  send 127 because the device can be host which is runing a loop to control its clients.
        # We jusr send \n as first commands for chain enumeration
        self.uart.write('\n')
        
        time.sleep(0.3)
        
        # dump all sync
        self.uart.read()
        
        #bytes = self.uart.read(3)
        #if bytes is None or len(bytes)<3: # or bytes[2] != 62:
        #    raise Exception("DUELink not responding")
        
        # Sync then discard all bytes
        #if len(bytes)>3:
        #    self.uart.read()
    
    def write(self, str):
        self.uart.write(str+"\n")
        
    def read(self, buf, timeout):
        pass           
    
    def execute(self, command):
        buf = bytearray(128)
        self.write(command)
        #self.read(buf, 100000)
        return self.__getResponse(command, buf.decode("utf-8"))
    
    def streamOutBytes(self, bytes):
        buf = bytearray(128)
        self.uart.write(bytearray(bytes))
        self.read(buf, 1000)
        return self.__getResponse("", buf.decode("utf-8"))
    
    def streamOutFloats(self, floats):
        buf = bytearray(128)
        for f in floats:
            bf = struct.pack("<f",f)            
            self.uart.write(bf)   
        self.read(buf, 1000)
        return self.__getResponse("", buf.decode("utf-8"))
        
    def __getResponse(self, command, response):
        #cmdIdx = response.find(command)
        #if cmdIdx == -1:
        #    cmdIdx = 0
        #else:
        #    cmdIdx = len(command)+2 # +2 skip \r\n
        
        #success = response[cmdIdx] != '!'
        #if not success:
        #    cmdIdx = cmdIdx + 1
            
        #if response[cmdIdx] == '>' or response[cmdIdx] == '&':
        #    return ("", success)
        
        #endIdx = response.find("\r\n>", cmdIdx)
        #if endIdx >= cmdIdx:
        #    return (response[cmdIdx:endIdx], success)
        
        #return ("", success)
        
        startms = time.ticks_ms()
        str_arr = ""
        total_receviced = 0
        responseValid = True
        dump = 0
        
        while (time.ticks_ms() - startms < self.ReadTimeout):            
            if self.uart.any() > 0:
                data = self.uart.read(1)                            
                str_arr = str_arr + data.decode("utf-8")
                
                total_receviced = total_receviced + 1                
                
                if data[0] == ord('\n'):
                    if self.uart.any() == 0:
                        time.sleep(0.001) # wait 1ms for sure
                    
                    # next byte can be >, &, !, $
                    if self.uart.any() > 0: 
                        dump = self.uart.read(1)
                        if dump[0] == ord('>') or dump[0] == ord('!') or dump[0] == ord('$'):
                            time.sleep(0.001) # wait 1ms for sure
                            
                            if self.uart.any() > 0:
                                responseValid = False
                        elif dump[0] == ord('\r'):#there is case 0\r\n\r\n> if use println("btnup(0)") example, this is valid
                            if self.uart.any() == 0:
                                time.sleep(0.001) # wait 1ms for sure
                                
                            if self.uart.any() > 0:
                                dump = self.uart.read(1)
                                
                                if dump[0] == ord('\n'):
                                    if self.uart.any() > 0:
                                        dump = self.uart.read(1)
                                else:
                                    responseValid = False
                            else:
                                responseValid = False
                        else:
                            # bad data
                            # One cmd send suppose one response, there is no 1234\r\n5678.... this will consider invalid response
                            responseValid = False
                            
                    if responseValid == False:
                        d = 0
                        while d != ord('\n') and time.ticks_ms() - startms < self.ReadTimeout:
                            if self.uart.any() > 0:
                                dump = self.uart.read(1)
                                d = dump[0]
                            else:
                                time.sleep(0.001) # wait 1ms for sure
                                
                            if d == ord('\n'):
                                if self.uart.any() > 0: # still bad data, repeat clean up
                                    d = 0 #reset to repeat the condition while loop
                    if str_arr == "" or len(str_arr) < 2: #reponse valid has to be xxx\r\n or \r\n, mean idx >=2
                        responseValid = False
                    elif responseValid == True:
                        if str_arr[len(str_arr)-2] != '\r':
                            responseValid = False
                        else:
                            str_arr = str_arr.replace("\n", "")
                            str_arr = str_arr.replace("\r", "")
                    break
                
                startms = time.ticks_ms() #reset timeout after valid data 
                
        success = total_receviced > 1 and responseValid == True
                
        return (str_arr, success)
        
                
        
    
