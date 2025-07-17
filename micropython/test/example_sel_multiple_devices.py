import time
import duelink  # standard lib
import genericmodule  # template lib

from duelink import transport
from genericmodule import GenericModuleController

due = duelink.DUELinkController(transport.UartTransportController(0))
gen = GenericModuleController(due)


while (1):    
    due.Engine.Select(1)
    due.Sound.Beep(11, 1000, 500)
    gen.StatLed(100,100, 1)
    time.sleep(3)
    
    due.Engine.Select(2)
    gen.StatLed(100,100, 2)
    time.sleep(3)
    
    due.Engine.Select(3)
    gen.StatLed(100,100, 3)
    time.sleep(3)
    
    due.Engine.Select(4)
    gen.StatLed(100,100, 4)
    time.sleep(3)
    
    







