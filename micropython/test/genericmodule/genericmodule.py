import time
import machine
import duelink

from duelink import transport

class GenericModuleController:    
    def __init__(self, due):                
        self.due = due
        
    def StatLed(self, high, low, count):
        self.due.System.StatLed(high, low, count)

 