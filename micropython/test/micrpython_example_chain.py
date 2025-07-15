import time
import duelink  # standard lib

from duelink import transport

# device 1 is oled 96
# device 2 is button s
# device 3 is buzzer

sclPIN = machine.Pin(23)
sdaPIN = machine.Pin(22)
 
i2c = transport.I2CTransportController(sda=sdaPIN, scl=sclPIN)
due = duelink.DUELinkController(i2c)
due.Engine.Select(1)

due.Engine.Select(3)
due.Frequency.Write(7, 1000, 100, 0.5)

due.Engine.Select(1)
due.Graphics.Clear(0)
due.Graphics.Text("DUELink", 1, 10, 10)
due.Graphics.Show()

while True:
    due.Engine.Select(2)
    time.sleep(0.1)
    x = due.Digital.Read(1, 1)
    
    if x == 0:
        due.Engine.Select(3)
        due.Frequency.Write(7, 1000, 100, 0.5)
    




    
    







