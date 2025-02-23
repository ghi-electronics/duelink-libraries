import machine
import duelink

sdaPIN = machine.Pin(0)
sclPIN = machine.Pin(1)
        
i2c = I2CTransport(sda=sdaPIN, scl=sclPIN)
due = DueLink(i2c)
due.led(100,100,50)