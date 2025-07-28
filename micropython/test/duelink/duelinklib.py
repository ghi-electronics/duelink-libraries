import machine
import time

from duelink.digital import DigitalController
from duelink.led import LedController
from duelink.analog import AnalogController
from duelink.button import ButtonController
from duelink.system import SystemController
from duelink.sound import SoundController
from duelink.graphics import GraphicsController, GraphicsType
from duelink.i2c import I2cController
from duelink.frequency import FrequencyController
from duelink.sound import SoundController
from duelink.engine import EngineController
from duelink.stream import StreamController
from duelink.coprocessor import CoprocessorController
from duelink.dmx import DMXController
from duelink.filesystem import FileSystemController
from duelink.distancesensor import DistanceSensorController

   
class DUELinkController:
    def __init__(self, serialPort):
        self.serialPort = serialPort
        self.Stream = StreamController(self.serialPort)
        self.Digital = DigitalController(self.serialPort)
        self.Analog = AnalogController(self.serialPort)
        self.Button = ButtonController(self.serialPort)
        self.System = SystemController(self.serialPort)
        self.Sound = SoundController(self.serialPort)
        self.Graphics = GraphicsController(self.serialPort)
        self.I2c = I2cController(self.serialPort)
        self.Frequency = FrequencyController(self.serialPort)
        self.Sound = SoundController(self.serialPort)
        self.Engine = EngineController(self.serialPort)
        self.Coprocessor = CoprocessorController(self.serialPort,self.Stream)
        self.DMX = DMXController(self.serialPort,self.Stream)
        self.FileSystem = FileSystemController(self.serialPort,self.Stream)
        self.DistanceSensor = DistanceSensorController(self.serialPort)
        
    
    def __get_ReadTimeout(self):
        return self.serialPort.ReadTimeout

    def __set_ReadTimeout(self, value: int):
        self.serialPort.ReadTimeout = value 

    ReadTimeout = property(__get_ReadTimeout, __set_ReadTimeout)
    
    
    


