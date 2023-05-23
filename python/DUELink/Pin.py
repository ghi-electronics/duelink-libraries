import time

class PinController:   
     
    def __init__(self):
        pass


    def get_button_a(self):
        return 97

    def get_button_b(self):
        return 98
    
    def get_led(self):
        return 108

    def get_piezo(self):
        return 112
    
    def get_pullnone(self):
        return 0
    
    def get_pullup(self):
        return 1
    
    def get_pulldown(self):
        return 2

    def set_empty(self, value: int):
        return    
    
    ButtonA = property(get_button_a, set_empty)  
    ButtonB = property(get_button_b, set_empty)   
    Led = property(get_led, set_empty) 
    Piezo = property(get_piezo, set_empty)
    PullNone = property(get_pullnone, set_empty)
    PullUp = property(get_pullup, set_empty)
    PullDown = property(get_pulldown, set_empty)
