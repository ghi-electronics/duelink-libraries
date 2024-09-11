class TemperatureSensorType():  
    def __init__(self):
        pass

    def __get_Dht11(self):
        return 11
    def __get_Dht12(self):
        return 12
    def __get_Dht21(self):
        return 21
    def __get_Dht22(self):
        return 22

    def __set_empty(self, value: int):
        return   

    DHT11 = property(__get_Dht11, __set_empty)  
    DHT12 = property(__get_Dht12, __set_empty)  
    DHT21 = property(__get_Dht21, __set_empty)  
    DHT22 = property(__get_Dht22, __set_empty)    

class TemperatureController:
    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Read(self, pin: int, sensortype: TemperatureSensorType) -> float:
        cmd = f"log(temp({pin},{sensortype}))"
        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadRespone()
        return float(res.respone)
        
