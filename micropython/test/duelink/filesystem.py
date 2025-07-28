
class FileSystemController:    

    def __init__(self, serialPort,stream):
        self.serialPort = serialPort
        self.stream = stream

    def __ParseReturn(self)->int:
        r,s = self.serialPort.ReadResponse()
        
        if (r):
            try:
                value = int(s)
                return value
            except:
                return -1
        return -1

    def FsMnt(self, type: int, cs: int, baud: int, max_handle: int)->int:            
        cmd = f"FsMnt({type}, {cs}, {baud}, {max_handle})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()

    def FsUnMnt(self)->int:        
        self.serialPort.WriteCommand("FsUnMnt()")
        return self.__ParseReturn()
    
    def FsFmt(self, type: int, cs: int, baud: int)->int:            
        cmd = f"FsFmt({type}, {cs}, {baud})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()
    
    def FsOpen(self, path: str, mode: int)->int:            
        cmd = f"FsOpen({path}, {mode})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()
    
    def FsClose(self, handle: int)->int:            
        cmd = f"FsClose({handle})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()
    
    def FsWrite(self, handle: int, data: bytes)->int:  
        count = len(data)          
        
        cmd = f"dim b9[{count}]"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        ret = self.stream.WriteBytes("b9", data)

        cmd = f"FsWrite({handle}, b9)"
        self.serialPort.WriteCommand(cmd)
        return self.__ParseReturn()
    
    def FsRead(self, handle: int, data: bytearray)->int:  
        count = len(data)          
        
        cmd = f"dim b9[{count}]"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()
        
        cmd = f"FsRead({handle}, b9)"
        self.serialPort.WriteCommand(cmd)    
        self.serialPort.ReadResponse()

        ret = self.stream.ReadBytes("b9",data)
        return ret
    
    def FsSync(self, handle: int)->int:            
        cmd = f"FsSync({handle})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()
    
    def FsSeek(self, handle: int, offset: int)->int:            
        cmd = f"FsSeek({handle},{offset})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()
    
    def FsTell(self, handle: int)->int:            
        cmd = f"FsTell({handle})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()
    
    def FsDel(self, path: str)->int:            
        cmd = f"FsDel({path})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()
    
    def FsFind(self, path: str)->int:            
        cmd = f"FsFind({path})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()
    
    def Fsfsz(self, path: str)->int:            
        cmd = f"Fsfsz({path})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn() 
