from DUELink.Analog import AnalogController
from DUELink.Button import ButtonController
from DUELink.Digital import DigitalController
from DUELink.Graphics import GraphicsController
from DUELink.GraphicsType import GraphicsTypeController
from DUELink.DistanceSensor import DistanceSensorController
from DUELink.Frequency import FrequencyController
from DUELink.I2C import I2cController
from DUELink.Infrared import InfraredController
from DUELink.System import SystemController
from DUELink.SerialInterface import SerialInterface
from DUELink.Servo import ServoController
from DUELink.Spi import SpiController
from DUELink.Touch import TouchController
from DUELink.Engine import EngineController
from DUELink.DeviceConfiguration import DeviceConfiguration
from DUELink.Temperature import TemperatureController
from DUELink.Humidity import HudimityController
from DUELink.Sound import SoundController
from DUELink.Temperature import TemperatureSensorType
from DUELink.Humidity import HumiditySensorType
from DUELink.Stream import StreamController
from DUELink.CoProcessor import CoProcessorController
from DUELink.DMX import DMXController
from DUELink.FileSystem import FileSystemController
from DUELink.Otp import OtpController
from DUELink.Pulse import PulseController
from DUELink.Rtc import RtcController
from DUELink.Uart import UartController

from enum import Enum
import platform
class DUELinkController:

    def __init__(self, comPort: str):
        if comPort is None:
            raise ValueError(f"Invalid comport: {comPort}")
        try:
            self.__Connect(comPort)
        except:
            raise Exception(f"Could not connect to the comport: {comPort}")
        
        if self.serialPort is None:
            raise Exception(f"serialPort is null")
        
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
        
    
    def __Connect(self, comPort: str):
        self.serialPort = SerialInterface(comPort)
        self.serialPort.Connect()

        # self.Version = self.serialPort.GetVersion()[1].strip()

        # if self.Version == "" or self.Version == "GHI Electronics DUELink v00.00:0000:00.09":
        #     raise Exception("The device is not supported.")
        
        self.DeviceConfig = DeviceConfiguration()

        # if self.Version[len(self.Version) -1] == 'P':
        #     self.DeviceConfig.IsPulse = True
        #     self.DeviceConfig.MaxPinIO = 23
        #     self.DeviceConfig.MaxPinAnalog = 29
        # elif self.Version[len(self.Version) -1] == 'I':
        #     self.DeviceConfig.IsPico = True
        #     self.DeviceConfig.MaxPinIO = 29
        #     self.DeviceConfig.MaxPinAnalog = 29  
        # elif self.Version[len(self.Version) -1] == 'F':
        #     self.DeviceConfig.IsFlea = True
        #     self.DeviceConfig.MaxPinIO = 11
        #     self.DeviceConfig.MaxPinAnalog = 29    
        # elif self.Version[len(self.Version) -1] == 'E':
        #     self.DeviceConfig.IsEdge = True
        #     self.DeviceConfig.MaxPinIO = 22
        #     self.DeviceConfig.MaxPinAnalog = 11  
        # elif self.Version[len(self.Version) -1] == 'R':
        #     self.DeviceConfig.IsRave = True
        #     self.DeviceConfig.MaxPinIO = 23
        #     self.DeviceConfig.MaxPinAnalog = 29
        # elif self.Version[len(self.Version) -1] == 'T':
        #     self.DeviceConfig.IsTick = True
        #     self.DeviceConfig.MaxPinIO = 23
        #     self.DeviceConfig.MaxPinAnalog = 11
        # elif self.Version[len(self.Version) -1] == 'D':
        #     self.DeviceConfig.IsDue = True
        #     self.DeviceConfig.MaxPinIO = 15
        #     self.DeviceConfig.MaxPinAnalog = 10

        self.serialPort.DeviceConfig = self.DeviceConfig        

    def Disconnect(self):
        self.serialPort.Disconnect()
    
    def Shutdown(self, pin: int):
        cmd = f'shtdn({pin})'
        self.serialPort.WriteCommand(cmd)
        response = self.serialPort.ReadResponse()
        return response.success    

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
    
    def __get_ReadTimeout(self):
        return self.serialPort.ReadTimeout

    def __set_ReadTimeout(self, value: int):
        self.serialPort.ReadTimeout = value 

    ReadTimeout = property(__get_ReadTimeout, __set_ReadTimeout)

    def __get_EnabledAsio(self):
        return self.serialPort.EnabledAsio

    def __set_EnabledAsio(self, value: int):
        self.serialPort.EnabledAsio = value 

    EnabledAsio = property(__get_EnabledAsio, __set_EnabledAsio)
   
         

        
        


