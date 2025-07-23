import machine
import time
import duelink  # standard lib

from duelink import transport

# device 1 is oled 96
# device 2 is button s
# device 3 is buzzer

sclPIN = machine.Pin(13)
sdaPIN = machine.Pin(12)
 
i2c = transport.I2CTransportController(12, 13,0)
due = duelink.DUELinkController(i2c)

due.Engine.Select(1)
due.Graphics.Clear(0)
due.Graphics.Text("DUELink", 1, 10, 10)
due.Graphics.Show()

due.Engine.Select(2)
due.Button.Enable(1,1,1)

while True:
    time.sleep(0.1)
    due.Engine.Select(2)
    
    if due.Button.Down(1):
        due.Engine.Select(3)
        due.Frequency.Write(7, 1000, 100, 0.5)
        

    




    
    







