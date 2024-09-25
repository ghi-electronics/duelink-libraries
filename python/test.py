from DUELink.DUELinkController import DUELinkController
from PIL import Image, ImageDraw, ImageFont

# Connect to BrainPad
availablePort = DUELinkController.GetConnectionPort()
duelink = DUELinkController(availablePort)
# BrainPad is ready
x = 100
duelink.Display.Clear(0)
duelink.Display.DrawText(str(x), 1, 0, 0)
duelink.Display.Show()


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

pixels = framebuffer.tobytes()

BrainPad.Display.PaletteFromBuffer(pixels, 3)

# Send to the BrainPad's display
BrainPad.Display.DrawBuffer(pixels, 4)