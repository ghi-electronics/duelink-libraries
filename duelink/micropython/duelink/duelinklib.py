import machine
import time

from duelink.digital import DigitalController
from duelink.led import LedController
from duelink.analog import AnalogController
from duelink.button import ButtonController
from duelink.system import SystemController
from duelink.sound import SoundController
from duelink.sound import SoundController

   
class DUELinkController:
    def __init__(self, transport):
        self.transport = transport
        self.Digital = DigitalController(self.transport)
        self.Led = LedController(self.transport)
        self.Analog = AnalogController(self.transport)
        self.Button = ButtonController(self.transport)
        self.System = SystemController(self.transport)
        self.Sound = SoundController(self.transport)

        
    
    
    


