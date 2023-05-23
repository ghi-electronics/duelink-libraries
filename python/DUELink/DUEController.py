from DUE.Analog import AnalogController
from DUE.Button import ButtonController
from DUE.Digital import DigitalController
from DUE.Display import DisplayController
from DUE.DistanceSensor import DistanceSensorController
from DUE.Frequency import FrequencyController
from DUE.I2C import I2cController
from DUE.Infrared import InfraredController
from DUE.Neo import NeoController
from DUE.System import SystemController
from DUE.SerialInterface import SerialInterface
from DUE.Servo import ServoController
from DUE.Sound import SoundController
from DUE.Spi import SpiController
from DUE.Touch import TouchController
from DUE.Uart import UartController
from DUE.Led import LedController
from DUE.Script import ScriptController
from DUE.DeviceConfiguration import DeviceConfiguration
from DUE.Pin import PinController
from DUE.Temperature import TemperatureController
from DUE.Humidity import HudimityController
from enum import Enum
import platform
class DUEController:

    def __init__(self, comPort: str):
        if comPort is None:
            raise ValueError(f"Invalid comport: {comPort}")
        try:
            self.__Connect(comPort)
        except:
            raise Exception(f"Could not connect to the comport: {comPort}")
        
        if self.serialPort is None:
            raise Exception(f"serialPort is null")

        self.Analog = AnalogController(self.serialPort)
        self.Digital = DigitalController(self.serialPort)
        self.I2c = I2cController(self.serialPort)
        self.Servo = ServoController(self.serialPort)
        self.Frequency = FrequencyController(self.serialPort)
        self.Spi = SpiController(self.serialPort)
        self.Infrared = InfraredController(self.serialPort)
        self.Neo = NeoController(self.serialPort)
        self.System = SystemController(self.serialPort)
        self.Uart = UartController(self.serialPort)
        self.Button = ButtonController(self.serialPort)
        self.Distance = DistanceSensorController(self.serialPort)
        self.Sound = SoundController(self.serialPort)
        self.Display = DisplayController(self.serialPort)
        self.Touch = TouchController(self.serialPort)
        self.Led = LedController(self.serialPort)
        self.Script = ScriptController(self.serialPort)
        self.Pin = PinController()
        self.Temperature = TemperatureController(self.serialPort)
        self.Humidity = HudimityController(self.serialPort)
    
    def __Connect(self, comPort: str):
        self.serialPort = SerialInterface(comPort)
        self.serialPort.Connect()

        self.Version = self.serialPort.GetVersion().split("\n")[0]

        if self.Version == "" or len(self.Version) != 7:
            raise Exception("The device is not supported.")
        
        self.DeviceConfig = DeviceConfiguration()

        if self.Version[len(self.Version) -1] == 'P':
            self.DeviceConfig.IsPulse = True
            self.DeviceConfig.MaxPinIO = 23
            self.DeviceConfig.MaxPinAnalog = 29
        elif self.Version[len(self.Version) -1] == 'I':
            self.DeviceConfig.IsPico = True
            self.DeviceConfig.MaxPinIO = 29
            self.DeviceConfig.MaxPinAnalog = 29  
        elif self.Version[len(self.Version) -1] == 'F':
            self.DeviceConfig.IsFlea = True
            self.DeviceConfig.MaxPinIO = 11
            self.DeviceConfig.MaxPinAnalog = 29    
        elif self.Version[len(self.Version) -1] == 'E':
            self.DeviceConfig.IsFlea = True
            self.DeviceConfig.MaxPinIO = 22
            self.DeviceConfig.MaxPinAnalog = 11  

        self.serialPort.DeviceConfig = self.DeviceConfig
            

    def Disconnect(self):
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
                    else:
                        return port.device

        return ""

                    
                
        
        


