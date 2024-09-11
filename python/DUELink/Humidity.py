class HumiditySensorType():  
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

class HudimityController:
    def __init__(self, serialPort):
        self.serialPort = serialPort

    def Read(self, pin: int, sensortype: HumiditySensorType) -> float:
        cmd = f"log(humidity({pin},{sensortype}))"
        self.serialPort.WriteCommand(cmd)

        res = self.serialPort.ReadRespone()
        return float(res.respone)
    
    def __get_dht11(self):
        return 11

    def __get_dht12(self):
        return 12
    
    def __get_dht21(self):
        return 21
    
    def __get_dht22(self):
        return 22
    
    def __set_dht(self):
        return
    
    Dht11 = property(__get_dht11, __set_dht)
    Dht12 = property(__get_dht12, __set_dht)
    Dht21 = property(__get_dht21, __set_dht)
    Dht22 = property(__get_dht22, __set_dht)
