
from DUELink.Display import DisplayColorDepth

class DisplayColorDepthController():  
    def __init__(self):
        pass


    def __get_OneBit(self):
        return DisplayColorDepth.OneBit
    def __get_FourBit(self):
        return DisplayColorDepth.FourBit
    def __get_EightBit(self):
        return DisplayColorDepth.EightBit
    def __get_SixteenBit(self):
        return DisplayColorDepth.SixteenBit   
    def __set_empty(self, value: int):
        return   

    OneBit = property(__get_OneBit, __set_empty)  
    FourBit = property(__get_FourBit, __set_empty)  
    EightBit = property(__get_EightBit, __set_empty)  
    SixteenBit = property(__get_SixteenBit, __set_empty)  
    
        



        
    
