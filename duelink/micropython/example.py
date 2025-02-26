import machine
import duelink

sdaPIN = machine.Pin(0)
sclPIN = machine.Pin(1)
        
i2c = duelink.I2CTransport(sda=sdaPIN, scl=sclPIN)
due = duelink.DueLink(i2c)
due.led(100,100,50)