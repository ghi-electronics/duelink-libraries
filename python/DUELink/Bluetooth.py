class BluetoothController:
    def __init__(self, serialPort):
        self.serialPort = serialPort

    def SetName(self, name) -> bool:
        cmd = f"wname(\"{name}\",{len(name)})"
        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadRespone()
        return res.success
    
    def SetSpeed(self, speed) -> bool:
        if speed != 115200 and speed != 9600:
            raise Exception("Support speed 9600 or 115200 only")
        
        cmd = f"wspeed({speed})"
        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadRespone()
        return res.success
    
    def SetPinCode(self, pinCode) -> bool:
        if pinCode.isdigit() == False or len(pinCode) != 4:
            raise Exception("PinCode invalid")
        
        cmd = f"wcode(\"{pinCode}\")"
        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadRespone()
        return res.success
