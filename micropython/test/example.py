
import duelink  # standard lib

from duelink import transport

due = duelink.DUELinkController(transport.UartTransportController(0))

# Play beep at pin 11 on DuePico
due.Sound.Beep(11, 1000, 500)

# Blink status led 10 times, delay 100ms each time
due.System.StatLed(100, 100, 10)




