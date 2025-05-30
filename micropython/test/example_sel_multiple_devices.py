import time
import duelink  # standard lib
import genericmodule  # standard lib

from duelink import transport
from genericmodule import GenericModuleController

due = duelink.DUELinkController(transport.UartTransportController(0))
gen = GenericModuleController()

# Play beep at pin 11 on DuePico
due.Sound.Beep(11, 1000, 500)

while (1):
    due.Engine.Select(1)
    gen.StatLed(100,100, 10)
    time.sleep(3)
    
    due.Engine.Select(2)
    gen.StatLed(100,100, 10)
    time.sleep(3)
    
    due.Engine.Select(3)
    gen.StatLed(100,100, 10)
    time.sleep(3)
    
    due.Engine.Select(4)
    gen.StatLed(100,100, 10)
    time.sleep(3)
    







