
import time

import neopixel
from machine import Pin

p11 = Pin(11, Pin.OUT)
p11.value(1)

p12 = Pin(12, Pin.OUT)
pixel = neopixel.NeoPixel(p12, 1)

pixel.brightness = 0.3

while True:
    pixel.fill((255, 0, 0))
    pixel.write()
    time.sleep(0.5)
    pixel.fill((0, 255, 0))
    pixel.write()
    time.sleep(0.5)
    pixel.fill((0, 0, 255))
    pixel.write()
    time.sleep(0.5)






