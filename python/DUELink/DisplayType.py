from DUELink.Display import DisplayType

class DisplayTypeController():  
    def __init__(self):
        pass


    def __get_ILI9342(self):
        return DisplayType.ILI9342
    def __get_ILI9341(self):
        return DisplayType.ILI9341
    def __get_ST7735(self):
        return DisplayType.ST7735
    def __get_SSD1306(self):
        return DisplayType.SSD1306
    def __get_BuiltIn(self):
        return DisplayType.BuiltIn
    
    def __set_empty(self, value: int):
        return   

    ILI9342 = property(__get_ILI9342, __set_empty)  
    ILI9341 = property(__get_ILI9341, __set_empty)  
    ST7735 = property(__get_ST7735, __set_empty)  
    SSD1306 = property(__get_SSD1306, __set_empty)  
    BuiltIn = property(__get_BuiltIn, __set_empty)  



        



        
    
