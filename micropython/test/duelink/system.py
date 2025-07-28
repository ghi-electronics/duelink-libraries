
class SystemController:    

    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Reset(self, option : int):
        cmd = "reset({0})".format(1 if option == 1 else 0)
        self.serialPort.WriteCommand(cmd)

        #Erase all send reset twice
        if (option == 1):
            self.serialPort.ReadResponse()
            self.serialPort.WriteCommand(cmd)

        # The device will reset in bootloader or system reset
        self.serialPort.Disconnect()

    def GetTickMicroseconds(self):
        cmd = "tickus()"
        self.serialPort.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()
        if r:
            try:
                return int(s)
            except:
                pass
        return -1
    
    def GetTickMilliseconds(self):
        cmd = "tickms()"
        self.serialPort.WriteCommand(cmd)
        r,s = self.serialPort.ReadResponse()
        if r:
            try:
                return int(s)
            except:
                pass
        return -1
    
    # def GetVersion(self):
        # command = "version()"
        # self.serialPort.WriteCommand(command)

        # version = self.serialPort.ReadResponse()

        

        # match = re.match(r"^([\w\s]+).*?(v[\d\.].*)", version.response)


        # if version.success:
            # self.serialPort.TurnEchoOff()
            # self.serialPort.portName.reset_input_buffer()
            # self.serialPort.portName.reset_output_buffer()
            # version.response = version.response[len(command):]

        # version_firmware = match.group(2).split(":")[0]
        # prod_id = match.group(2).split(":")[1]
        # version_boot_loader = match.group(2).split(":")[2]


        # return version_firmware, prod_id, version_boot_loader
    
    def Info(self, code):
        cmd = f"info({code})"
        self.serialPort.WriteCommand(cmd)

        r,s = self.serialPort.ReadResponse()

        if r:            
            try:
                value = int(s)
                return value
            except:
                pass

        return 0
        
    def StatLed(self, highPeriod: int, lowPeriod: int, count: int) -> bool:
        cmd = f"statled({highPeriod},{lowPeriod},{count})"
        self.serialPort.WriteCommand(cmd)

        r,s = self.serialPort.ReadResponse()
        return r
    
    def Shtdn(self, wkpin: int)-> bool:
        cmd = f"shtdn({wkpin})"
        self.serialPort.WriteCommand(cmd)

        r,s = self.serialPort.ReadResponse()
        return r
        
    def SetArrayValue(self, var, data, offset=0, count=-1):
        if count == -1:
            count = len(data)-offset
        if len(var) != 2:
            raise Exception("Invalid array variable")
        
        if (
            (var[0] != 'a' and var[0] != 'A' and var[0] != 'b' and var[0] != 'B')
            or (var[1] < '0' or var[1] > '9')
        ):
            raise Exception("Invalid array variable must be A0..A9 or B0..B9")
                                                                                                         
        r, s = self.serialPort.execute(f"dim {var}[{count}]")
        r, s = self.serialPort.execute(f"strmwr({var},{count})")
        if not s:
            raise Excpetion(r)
        if count > 0:
            if var[0] == 'b':
                self.serialPort.streamOutBytes(data[offset:offset+count])
            elif var[0] == 'a':
                self.serialPort.streamOutFloats(data[offset:offset+count])
        
        
