import time
import duelink  # standard lib
import genericmodule  # standard lib

from duelink import transport
from genericmodule import GenericModuleController

due = duelink.DUELinkController(transport.UartTransportController(0))
gen = GenericModuleController(due)

due.Sound.Beep(11, 1000, 500)
i = 10

while (i > 0):
    print(i)
    i = i - 1
    time.sleep(1)

while (1):    
    due.Engine.Select(1)
    due.Sound.Beep(11, 1000, 500)
    gen.StatLed(100,100, 1)
    time.sleep(1)
    print("1")
        
    due.Engine.Select(2)
    gen.StatLed(100,100, 2)
    time.sleep(1)
    print("2")
    
    due.Engine.Select(3)
    gen.StatLed(100,100, 3)
    time.sleep(1)
    print("3")
    
    due.Engine.Select(4)
    gen.StatLed(100,100, 3)
    time.sleep(1)
    print("4")
    


    
    







