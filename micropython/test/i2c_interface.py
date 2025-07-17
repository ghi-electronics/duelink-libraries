import time
import machine
import duelink
 
from duelink import transport
from machine import Pin, Timer

# I2C need pullup module
sclPIN = machine.Pin(23)
sdaPIN = machine.Pin(22)
 
i2c = transport.I2CTransportController(sda=sdaPIN, scl=sclPIN)
due = duelink.DUELinkController(i2c)
 



due.Led.Set(50,50,0)
 
