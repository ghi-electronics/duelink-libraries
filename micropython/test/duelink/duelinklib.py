import machine
import time

from duelink.analog import AnalogController
from duelink.button import ButtonController
from duelink.digital import DigitalController
from duelink.graphics import GraphicsController
from duelink.graphicsType import GraphicsTypeController
from duelink.distanceSensor import DistanceSensorController
from duelink.frequency import FrequencyController
from duelink.i2c import I2cController
from duelink.infrared import InfraredController
from duelink.system import SystemController
from duelink.serialInterface import SerialInterface
from duelink.servo import ServoController
from duelink.spi import SpiController
from duelink.touch import TouchController
from duelink.engine import EngineController
from duelink.deviceConfiguration import DeviceConfiguration
from duelink.temperature import TemperatureController
from duelink.humidity import HudimityController
from duelink.sound import SoundController
from duelink.temperature import TemperatureSensorType
from duelink.humidity import HumiditySensorType
from duelink.stream import StreamController
from duelink.coprocessor import CoProcessorController
from duelink.dmx import DMXController
from duelink.filesystem import FileSystemController
from duelink.otp import OtpController
from duelink.pulse import PulseController
from duelink.rtc import RtcController
from duelink.uart import UartController

   
class DUELinkController:
    def __init__(self, serialPort):
        self.serialPort = serialPort
        self.Stream = StreamController(self.serialPort)
        self.Analog = AnalogController(self.serialPort)
        self.Digital = DigitalController(self.serialPort)        
        self.Servo = ServoController(self.serialPort)
        self.Frequency = FrequencyController(self.serialPort)        
        self.Infrared = InfraredController(self.serialPort)
        self.Button = ButtonController(self.serialPort)
        self.Distance = DistanceSensorController(self.serialPort)
        self.Graphics = GraphicsController(self.serialPort)
        self.Touch = TouchController(self.serialPort)        
        self.Engine = EngineController(self.serialPort)
        self.Temperature = TemperatureController(self.serialPort)
        self.Humidity = HudimityController(self.serialPort)
        self.System = SystemController(self.serialPort)        
        self.GraphicsType = GraphicsTypeController()        
        self.Sound = SoundController(self.serialPort)
        self.TemperatureSensorType = TemperatureSensorType()
        self.HumiditySensorType = HumiditySensorType()       
        self.Pulse = PulseController(self.serialPort)

        self.CoProcessor = CoProcessorController(self.serialPort,self.Stream)
        self.DMX = DMXController(self.serialPort,self.Stream)
        self.FileSystem = FileSystemController(self.serialPort,self.Stream)
        self.Otp = OtpController(self.serialPort,self.Stream)        
        self.Rtc = RtcController(self.serialPort,self.Stream)
        self.I2c = I2cController(self.serialPort,self.Stream)
        self.Spi = SpiController(self.serialPort,self.Stream)
        self.Uart = UartController(self.serialPort,self.Stream)
        
    
    def __get_ReadTimeout(self):
        return self.serialPort.ReadTimeout

    def __set_ReadTimeout(self, value: int):
        self.serialPort.ReadTimeout = value 

    ReadTimeout = property(__get_ReadTimeout, __set_ReadTimeout)
    
    
    


