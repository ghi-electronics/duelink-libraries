from Due.Analog import AnalogController
from Due.Button import ButtonController
from Due.Digital import DigitalController
from Due.Display import DisplayController
from Due.DistanceSensor import DistanceSensorController
from Due.Frequency import FrequencyController
from Due.I2C import I2cController
from Due.Infrared import InfraredController
from Due.Neo import NeoController
from Due.System import SystemController
from Due.Pwm import PwmController
from Due.SerialInterface import SerialInterface
from Due.ServoMoto import ServoMotoController
from Due.Sound import SoundController
from Due.Spi import SpiController
from Due.Touch import TouchController
from Due.Uart import UartController
from Due.Led import LedController
from Due.Script import ScriptController
from enum import Enum
import platform
class DueController:

    def __init__(self, comPort: str):
        if comPort is None:
            raise ValueError("Invalid comport")
        self.connect(comPort)
        self.Analog = AnalogController(self.serialPort)
        self.Digital = DigitalController(self.serialPort)
        self.I2c = I2cController(self.serialPort)
        self.ServoMoto = ServoMotoController(self.serialPort)
        self.Frequency = FrequencyController(self.serialPort)
        self.Spi = SpiController(self.serialPort)
        self.Infrared = InfraredController(self.serialPort)
        self.Neo = NeoController(self.serialPort)
        self.Pwm = PwmController(self.serialPort)
        self.System = SystemController(self.serialPort)
        self.Uart = UartController(self.serialPort)
        self.Button = ButtonController(self.serialPort)
        self.Distance = DistanceSensorController(self.serialPort)
        self.Sound = SoundController(self.serialPort)
        self.Display = DisplayController(self.serialPort)
        self.Touch = TouchController(self.serialPort)
        self.Led = LedController(self.serialPort)
        self.Script = ScriptController(self.serialPort)

        self.Version: str = self.serialPort.GetVersion().split("\n")[0]

    def connect(self, comPort: str):
        self.serialPort = SerialInterface(comPort)
        self.serialPort.Connect()

    def disconnect(self):
        self.serialPort.Disconnect()

    def GetConnectionPort():
        try:
            from serial.tools.list_ports import comports
        except ImportError:
            return ""
        
        if comports:
            com_ports_list = list(comports())
            ebb_ports_list = []
            for port in com_ports_list:               
                if port.vid ==0x1B9F and port.pid==0xF300:
                    if (platform.system() == 'Windows'):
                        return port.name
                    if (platform.system() == 'Linux'):
                        return port.device

        return ""
                    
                
        
        


