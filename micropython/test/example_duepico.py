import time
import machine
import duelink

from duelink import transport
from duelink.graphics import GraphicsType
from machine import Pin, Timer

def Cmd(c):
    due.I2c.Write(0x3c, [0,c])
    
uart = transport.UartTransportController(0)
due = duelink.DUELinkController(uart)

due.System.New() # Make sure all memory is available

due.Digital.Write(9,1) # reset pin
due.I2c.Configuration(1000)
time.sleep(0.1)
due.Graphics.Configuration(GraphicsType.I2c, [0x3c], 128, 64, 1)
Cmd(0xAE);Cmd(0x00);Cmd(0x10)
Cmd(0x40);Cmd(0x81);Cmd(0xCF)
Cmd(0xA1);Cmd(0xA6);Cmd(0xA8)
Cmd(0x3F);Cmd(0xD3);Cmd(0x00)
Cmd(0xD5);Cmd(0x80);Cmd(0xD9)
Cmd(0xF1);Cmd(0xDA);Cmd(0x12)
Cmd(0xDB);Cmd(0x40);Cmd(0x8D)
Cmd(0x14);Cmd(0xAF);Cmd(0xC8)
Cmd(0x20);Cmd(0x00);Cmd(0x21)
Cmd(0);Cmd(128-1)
Cmd(0x22);Cmd(0);Cmd(7)

due.System.SetArrayValue("a1", [0,0,1,1,1,1,0,0,
                                0,1,1,1,1,1,1,0,
                                1,1,0,1,1,0,1,1,
                                1,1,1,1,1,1,1,1,
                                1,1,0,1,1,0,1,1,
                                1,1,1,0,0,0,1,1,
                                0,1,1,1,1,1,1,0,
                                0,0,1,1,1,1,0,0])

due.System.SetArrayValue("a2", [200,50,300,25])

due.Frequency.Write(6,1000,1000)
due.System.StatLed(100,100,10)
due.Sound.MelodyPlay(11, [1000,100,2000,100,500,100])

speed=3
r=10;x=64;y=32;dx=speed;dy=speed
while True:
    due.Graphics.Clear(0)
    due.Graphics.Text("DUELink",1,43,0)
    due.Graphics.DrawImage("a1",x-4,y-4,8,8,1)
    due.Graphics.Circle(1,x,y,r)
    due.Graphics.Show()
    if x-speed <= r or x+speed >= 127-r:
        dx=-dx
        due.Sound.MelodyPlay(11, "a2")
        due.transport.execute("print(a2)")
    if y-speed <= r or y+speed >= 63-r:
        dy=-dy
        due.Sound.MelodyPlay(11, "a2")
    x=x+dx;y=y+dy

