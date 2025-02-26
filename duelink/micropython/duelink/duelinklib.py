import machine
import time

class I2CTransport:
    def __init__(self, sda, scl, freq=400000, addr=0x52):
        self.i2c = machine.I2C(0, sda = sda, scl = scl, freq=freq)
        self.addr = addr
        
    def write(self, str):
        self.i2c.writeto(self.addr, str+"\n")
        
    def read(self, buf, timeout):
        startms = time.ticks_ms()
        bytesToRead = 0;
        i=0
        while (time.ticks_ms() - startms < timeout):
            bytes = self.i2c.readfrom(self.addr, 1)
            if len(bytes) > 0:
                c = bytes[0]
                if c >= 0 and c <= 127:
                    bytesToRead=len(buf)-2
                    buf[i] = c
                    i = i + 1
                    break
        if bytesToRead > 0 and buf[0] != '>':
            bytes = self.i2c.readfrom(self.addr, bytesToRead)
            while (time.ticks_ms() - startms < timeout) and bytesToRead > 0:
                for c in bytes:
                    if c >= 0 and c <= 127:
                        buf[i] = c
                        i = i + 1
                        bytesToRead = bytesToRead - 1
                        if bytesToRead == 0:
                            break
    
class DueLink:
    def __init__(self, transport):
        self.transport = transport
        
    def execute(self, command):
        buf = bytearray(128)
        self.transport.write(command)
        self.transport.read(buf, 1000)
        return self.__getResponse(command, buf.decode("utf-8"))
    
    def echo(self, state):
        if state != 0:
            self.execute("echo(1)")
        else:
            self.execute("echo(0)")
            
    def led(self, high, low, count):
        self.execute(f"led({high},{low},{count})")
        
    def dread(self, pin, pull):
        r, s = self.execute(f"dread({pin},{pull})")
        if s:
            return int(r, 10)
        return 0
    
    def dwrite(self, pin, state):
        self.execute(f"dwrite({pin},{state})")
        
    def vread(self, pin, pull):
        r, s = self.execute(f"vread({pin})")
        if s:
            return float(r)
        return 0
    
    def pwrite(self, pin, power):
        self.execute(f"pwrite({pin},{power})")
        
    def beep(self, pin, freq, duration):
        self.execute(f"beep({pin},{freq},duration)")
        
    def btnEnable(self, pin, state):
        if state :
            self.execute(f"btnenable({pin},1)")
        else:
            self.execute(f"btnenable({pin},0)")
            
    def btnUp(self, pin):
        r, s = self.execute(f"btnup({pin})")
        if s:
            return r[0] == '1'
        return 0
    
    def btnDown(self, pin):
        r, s = self.execute(f"btndown({pin})")
        if s:
            return r[0] == '1'
        return 0
        
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
    
    


