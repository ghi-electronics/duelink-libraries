import sys
from PIL import Image
from DUELink.DUELinkController import DUELinkController
import serial
import time

availablePort = DUELinkController.GetConnectionPort()
duelink = DUELinkController(availablePort)


# Test digital read

# duelink.Digital.Write(1, 1)

# print(duelink.System.GetTickMicroseconds())
# print(duelink.System.GetTickMilliseconds())

# Test analog read

# print(duelink.Analog.Read(1))

# Test sound

# duelink.Sound.Beep(4, 500, 1000)

# Test melody

# duelink.Sound.MelodyPlay(4, [1000, 1000, 900, 1000, 800, 1000])
# time.sleep(2)
# duelink.Sound.MelodyStop(4)

# Test LED

# duelink.Led.Set(200, 200, 10)

# Test buttons

# duelink.Button.Enable(23, 1)


# while True:
#     d = duelink.Button.Down(23)
#     u = duelink.Button.Up(23)

#     if (d):
#         print("Button A down")
    
#     if u:
#         print("Button A up")
    
#     time.sleep(0.5)

# Test frequency

# while True:
#     for x in range(800, 1000):
#         duelink.Frequency.Write(1, x, 200, 50)
#         time.sleep(2)

# Test touch sensors

# while True:
#     print(duelink.Touch.Touch(1, 100, 1, 1000))
#     time.sleep(1)

# Test distance

# while True:
#     print(duelink.Distance.Read(2, 1))
#     time.sleep(0.5)

# Test the infrared features

# duelink.Infrared.Enable(1, 1)

# while True:
#     print(duelink.Infrared.Read())
#     time.sleep(1)

# Test the servo motor

# duelink.Servo.Set(1, 90)

# Test temperature and humidity

# while True:
#     x = duelink.Temperature.Read(1, 1)
#     y = duelink.Humidity.Read(1, 1)

#     f = (x * 1.8) + 32

#     print(f"Temperature Celsius = {x}")
#     print(f"Temperature Fahrenheit = {f}")

#     print(f"Humidity: {y}")

#     time.sleep(1)




# Test drawing shapes and lines on the Pixobit

# duelink.Graphics.Clear(1)

# duelink.Graphics.Pixel(0, 20, 20)

# duelink.Graphics.Circle(1, 30, 30, 2)
# duelink.Graphics.Line(0, 20, 20, 70, 70)
# duelink.Graphics.Rect(0, 30, 30, 20, 20)
# duelink.Graphics.Fill(0, 30, 30, 20, 20)
# duelink.Graphics.Text("Duelink Is Awesome", 0, 40, 50)
# duelink.Graphics.TextT("Hi", 0, 0, 20)

# duelink.Graphics.Show()

# print(duelink.Graphics.GetHeight())
# print(duelink.Graphics.GetWidth())
# print(duelink.Graphics.IsColor())

# Test rendering images on Pixobit

# duelink.Graphics.Clear(0)

# duelink.Graphics.DrawImageScale([0, 0, 0, 1, 1, 0, 0, 0, 
# 0, 0, 1, 1, 1, 1, 0, 0, 
# 0, 1, 1, 1, 1, 1, 1, 0,
# 1, 1, 0, 1, 1, 0, 1, 1,
# 1, 1, 1, 1, 1, 1, 1, 1,
# 0, 0, 1, 0, 0, 1, 0, 0,
# 0, 1, 0, 1, 1, 0, 1, 0,
# 1, 0, 1, 0, 0, 1, 0, 1], 0, 0, 8, 8, 3, 3, 0)

# duelink.Graphics.DrawImage([0, 0, 0, 1, 1, 0, 0, 0, 
# 0, 0, 1, 1, 1, 1, 0, 0, 
# 0, 1, 1, 1, 1, 1, 1, 0,
# 1, 1, 0, 1, 1, 0, 1, 1,
# 1, 1, 1, 1, 1, 1, 1, 1,
# 0, 0, 1, 0, 0, 1, 0, 0,
# 0, 1, 0, 1, 1, 0, 1, 0,
# 1, 0, 1, 0, 0, 1, 0, 1], 0, 0, 8, 8, 0)

# duelink.Graphics.Show()

# Test the Pixobit Graphics

# duelink.Graphics.Show()

# x = 6
# while True:
#     duelink.Graphics.TextT("DUELink", 1, x, 0)

#     duelink.Graphics.Show()

#     x -= 1

#     if x < -60:
#         x = 6
    
#     time.sleep(.25)
#     duelink.Graphics.Clear(0)


# Test Displaying color on SPITFT23 Graphics

# duelink.Graphics.Clear(0)

# while True:
#     duelink.Graphics.Text("DUELink", 0x00ff0000, 30, 5)
#     duelink.Graphics.Show()
#     time.sleep(1)


# Test manually entering duelink commands from python.

# duelink.Engine.Run('MelodyP(4, {1000, 1000, 900, 1000, 800, 1000})')




# Test NeoPixel Graphics

# duelink.Graphics.Clear(0)
# duelink.Graphics.Circle(0xffff00, 3, 3, 2)
# duelink.Graphics.Show()


# Test getting duelink version

firmware, productId, bootloader = duelink.System.GetVersion()

print("Firmware version on module:", firmware)
print("Product ID of module:", productId)
print("Bootloader version on module:", bootloader)


# Test Select when using multiple modules

# duelink.Engine.Select(1)

# duelink.Graphics.Clear(0)

# duelink.Graphics.Circle(1, 50, 50, 5)

# duelink.Graphics.Show()

# Test ReadVCC function

# print(duelink.GetVCC())

# Test Record


# duelink.Engine.Record('''
# dim b1[2]

# fn SendCmd(c)
# 	b1[0] = 0
# 	b1[1] = c
#     i2cwr(0x3c,b1,[])
# fend

# Init()
# Circle(1,20,20,10)
# show()

# fn Init()
# dwrite(11,1) # reset pin
# # config I2C bus with 400Kz
# i2ccfg(400)
# Wait(20)
# GfxCfg(1,[0x3C],128,64, 1)


# SendCmd(0xAE):SendCmd(0x00):SendCmd(0x10)
# SendCmd(0x40):SendCmd(0x81):SendCmd(0xCF)
# SendCmd(0xA1):SendCmd(0xA6):SendCmd(0xA8)
# SendCmd(0x3F):SendCmd(0xD3):SendCmd(0x00)
# SendCmd(0xD5):SendCmd(0x80):SendCmd(0xD9)
# SendCmd(0xF1):SendCmd(0xDA):SendCmd(0x12)
# SendCmd(0xDB):SendCmd(0x40):SendCmd(0x8D)
# SendCmd(0x14):SendCmd(0xAF):SendCmd(0xC8)
# SendCmd(0x20):SendCmd(0x00):SendCmd(0x21)
# SendCmd(0):SendCmd(128-1)
# SendCmd(0x22):SendCmd(0):SendCmd(7)

# fend

# fn IsColor()
# return 0
# fend

# fn GetW()
# return 128
# fend

# fn GetH()
# return 64
# fend
# ''')

# print(duelink.Engine.Read())