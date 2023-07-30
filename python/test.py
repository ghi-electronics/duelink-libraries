from DUELink.DUELinkController import DUELinkController
from PIL import Image, ImageDraw, ImageFont

# Connect to BrainPad
availablePort = DUELinkController.GetConnectionPort()
BrainPad = DUELinkController(availablePort)
# BrainPad is ready

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
framebuffer = framebuffer.resize((160, 120))

#framebuffer =Image.new("RGBA", (BrainPad.Display.Width, BrainPad.Display.Height), "green")

# Get the pixel data as a flat array of values
#pixels = list(framebuffer.getdata())
pixels = framebuffer.tobytes()

BrainPad.Display.PaletteFromBuffer(pixels, 3)

# Send to the BrainPad's display
BrainPad.Display.DrawBuffer(pixels, 16)