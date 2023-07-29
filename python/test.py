from DUELink.DUELinkController import DUELinkController
from PIL import Image, ImageDraw, ImageFont

# Connect to BrainPad
availablePort = DUELinkController.GetConnectionPort()
BrainPad = DUELinkController(availablePort)
# BrainPad is ready

for i in range(0,16):
    BrainPad.Display.Palette(i, ((((i>>3)&1) * 255)<<16) | ((((i>>2)&1) * 255)<<8) | int(((i&3) * 255 / 255)))

# framebuffer =Image.new("RGBA", (BrainPad.Display.Width, BrainPad.Display.Height), "red")
# draw = ImageDraw.Draw(framebuffer)

# font = ImageFont.truetype("arial.ttf", 18)

# # Draw Some Text
# draw.text(
#     (30,30),
#     text = "Hello Python",
#     font=font,
#     fill="white",
# )

framebuffer = Image.open("C:\\Users\\chris\\OneDrive\\Pictures\\Cape Town 2009\\DSCN0082.JPG").convert("RGBA")

framebuffer = framebuffer.resize((160,120))

# Get the pixel data as a flat array of values
pixels = list(framebuffer.getdata())

BrainPad.Display.PaletteFromBuffer(pixels)

# Send to the BrainPad's display
BrainPad.Display.DrawBuffer(pixels, 8)