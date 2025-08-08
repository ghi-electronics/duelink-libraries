
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

    def Write(self, type: int, cs: int, baud: int, max_handle: int)->int:            
        cmd = f"FsMnt({type}, {cs}, {baud}, {max_handle})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()

    def UnMount(self)->int:        
        self.serialPort.WriteCommand("FsUnMnt()")
        return self.__ParseReturn()
    
    def Format(self, type: int, cs: int, baud: int)->int:            
        cmd = f"FsFmt({type}, {cs}, {baud})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()
    
    def Open(self, path: str, mode: int)->int:            
        cmd = f"FsOpen({path}, {mode})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()
    
    def Close(self, handle: int)->int:            
        cmd = f"FsClose({handle})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()
    
    def Write(self, handle: int, data: bytes)->int:  
        count = len(data)          
        
        cmd = f"dim b9[{count}]"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()

        ret = self.stream.WriteBytes("b9", data)

        cmd = f"FsWrite({handle}, b9)"
        self.serialPort.WriteCommand(cmd)
        return self.__ParseReturn()
    
    def Read(self, handle: int, data: bytearray)->int:  
        count = len(data)          
        
        cmd = f"dim b9[{count}]"
        self.serialPort.WriteCommand(cmd)
        self.serialPort.ReadResponse()
        
        cmd = f"FsRead({handle}, b9)"
        self.serialPort.WriteCommand(cmd)    
        self.serialPort.ReadResponse()

        ret = self.stream.ReadBytes("b9",data)
        return ret
    
    def Sync(self, handle: int)->int:            
        cmd = f"FsSync({handle})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()
    
    def Seek(self, handle: int, offset: int)->int:            
        cmd = f"FsSeek({handle},{offset})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()
    
    def Tell(self, handle: int)->int:            
        cmd = f"FsTell({handle})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()
    
    def Delete(self, path: str)->int:            
        cmd = f"FsDel({path})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()
    
    def Find(self, path: str)->int:            
        cmd = f"FsFind({path})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn()
    
    def Size(self, path: str)->int:            
        cmd = f"Fsfsz({path})"
        self.serialPort.WriteCommand(cmd)
        
        return self.__ParseReturn() 
