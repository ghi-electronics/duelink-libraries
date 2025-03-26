import machine
import time

from duelink.digital import DigitalController


   
class DUELinkController:
    def __init__(self, transport):
        self.transport = transport
        self.Digital = DigitalController(self.transport)

        
    
    
    


