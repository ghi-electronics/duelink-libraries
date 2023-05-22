import time

class PinController:   
     
    BUTTON_A = 97
    BUTTON_B = 98
    LED = 108
    PIEZO = 112
    PULLNONE = 0
    PULLUP = 1
    PULLDOWN = 2

    def __init__(self):
        self.ButtonA = PinController.BUTTON_A
        self.ButtonB = PinController.BUTTON_B
        self.Led = PinController.LED
        self.Piezo = PinController.PIEZO

        self.PullNone = PinController.PULLNONE
        self.PullUp = PinController.PULLUP

        self.PullDown = PinController.PULLDOWN
