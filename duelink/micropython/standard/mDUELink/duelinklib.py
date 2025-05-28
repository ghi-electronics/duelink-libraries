import machine
import time

from mduelink.digital import DigitalController
from mduelink.led import LedController
from mduelink.analog import AnalogController
from mduelink.button import ButtonController
from mduelink.system import SystemController
from mduelink.sound import SoundController
from mduelink.graphics import GraphicsController, GraphicsType
from mduelink.i2c import I2cController
from mduelink.frequency import FrequencyController
from mduelink.sound import SoundController

   
class DUELinkController:
    def __init__(self, transport):
        self.transport = transport
        self.Digital = DigitalController(self.transport)
        self.Led = LedController(self.transport)
        self.Analog = AnalogController(self.transport)
        self.Button = ButtonController(self.transport)
        self.System = SystemController(self.transport)
        self.Sound = SoundController(self.transport)
        self.Graphics = GraphicsController(self.transport)
        self.I2c = I2cController(self.transport)
        self.Frequency = FrequencyController(self.transport)
        self.Sound = SoundController(self.transport)
    
    
    


