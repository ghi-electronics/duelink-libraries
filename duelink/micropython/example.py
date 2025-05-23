import time
import machine
import duelink

from duelink import transport
from machine import Pin, Timer

sclPIN = machine.Pin(23)
sdaPIN = machine.Pin(22)

i2c = transport.I2CTransportController(sda=sdaPIN, scl=sclPIN)
due = duelink.DUELinkController(i2c)

print(due.System.Info(1))

while True:
    due.Led.Set(1,0,0)
    time.sleep(0.5)
    due.Led.Set(0,1,0)
    time.sleep(0.5)



