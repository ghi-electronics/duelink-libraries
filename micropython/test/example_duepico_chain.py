import time
import duelink  # standard lib

from duelink import transport

# Device 1 is DuePico
# device 2 is oled 96
# device 3 is button s
# device 4 is buzzer

uart = transport.UartTransportController(0)
due = duelink.DUELinkController(uart)

due.Engine.Select(2)
due.Graphics.Clear(0)
due.Graphics.Text("DUELink", 1, 10, 10)
due.Graphics.Show()

due.Engine.Select(3)
due.Button.Enable(1,1,1)

while True:
    due.Engine.Select(3)    
    if due.Button.Down(1):
        due.Engine.Select(4)
        due.Frequency.Write(7, 1000, 100, 0.5)

    time.sleep(0.1)