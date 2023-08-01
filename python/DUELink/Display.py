
from enum import IntEnum



class DisplayType(IntEnum):  

    ILI9342 = 0
    ILI9341 = 1
    ST7735 = 2
    SSD1306 = 3
    BuiltIn = 0xff


class DisplayConfiguration:        
    def __init__(self, serialPort, display, system):   
        self.Type = DisplayType.BuiltIn  

        self.I2cAddress = 0

        self.SpiChipSelect = 0
        self.SpiDataControl = 0
        self.SpiPortrait = False
        self.SpiFlipScreenHorizontal = False
        self.SpiFlipScreenVertical = False
        self.SpiSwapRedBlueColor = False
        self.SpiSwapByteEndianness = False

        self.serialPort = serialPort
        self.display = display
        self.system = system

        if (self.serialPort.DeviceConfig.IsPulse or self.serialPort.DeviceConfig.IsRave ):
            self.Update()

    def Update(self) -> bool:
        param = 0
 
        param |= (self.Type)
        param |= (self.SpiChipSelect) << 8
        param |= (self.SpiDataControl) << 14

        portrait = 0

        if (self.SpiPortrait == True):
            portrait = 1

        mirror = 0

        if (self.SpiFlipScreenHorizontal == True):
            mirror = 1

        flip = 0

        if (self.SpiFlipScreenVertical == True):
            flip = 1

        swapgrb = 0

        if (self.SpiSwapRedBlueColor == True):
            swapgrb = 1

        swapbytes = 0

        if (self.SpiSwapByteEndianness == True):
            swapbytes = 1

        
        param |= portrait << 20
        param |= mirror << 21
        param |= flip << 22
        param |= swapgrb << 23
        param |= swapbytes << 24


        if (self.Type == DisplayType.BuiltIn or param == 0) :
            if (self.serialPort.DeviceConfig.IsTick == False and self.serialPort.DeviceConfig.IsPulse == False and self.serialPort.DeviceConfig.IsRave == False) :
                raise Exception("The device does not support BuiltIn display")
            
            else:
                param = 0
            

            if (self.serialPort.DeviceConfig.IsTick) :
                self.display.Width = 5
                self.display.Height = 5
            
            elif (self.serialPort.DeviceConfig.IsPulse) :
                self.display.Width = 128
                self.display.Height = 64                
            
            elif (self.serialPort.DeviceConfig.IsRave) :
                self.display.Width = 160
                self.display.Height = 120                
            
        
        if ((self.serialPort.DeviceConfig.IsTick or self.serialPort.DeviceConfig.IsEdge) and (self.Type != DisplayType.SSD1306)):
            raise Exception("The device does not support SPI display")
        
        
        match (self.Type) :
            case DisplayType.SSD1306:
                self.display.Width = 128
                self.display.Height = 64
                param = self.I2cAddress
            
            case DisplayType.ILI9342 | DisplayType.ILI9341:            
                self.display.Width = 160
                self.display.Height = 120
                param |= 1 << 7


            case DisplayType.ST7735:
                self.display.Width = 160
                self.display.Height = 128
                param |= 1 << 7

        target = 0
        cmd = f"lcdconfig({target},{param})"

        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()

        if (res.success == True):
            if (self.system != None ):
                self.system.UpdateDisplay(self.display)

        return res.success



class DisplayController:
    def __init__(self, serialPort):
        self.serialPort = serialPort
        self.Configuration = None
        self.__palette = [
            0x000000, # Black  
            0xFFFFFF, # White  
            0xFF0000, # Red    
            0x32CD32, # Lime   
            0x0000FF, # Blue   
            0xFFFF00, # Yellow 
            0x00FFFF, # Cyan   
            0xFF00FF, # Magenta
            0xC0C0C0, # Silver 
            0x808080, # Gray   
            0x800000, # Maroon 
            0xBAB86C, # Oliver 
            0x00FF00, # Green  
            0xA020F0, # Purple 
            0x008080, # Teal   
            0x000080, # Navy
        ]
        
        self.Width = 128
        self.Height = 64
        if (self.serialPort.DeviceConfig.IsRave):
            self.Width = 160
            self.Height = 120

    def Show(self):
        cmd = "lcdshow()"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def Clear(self, color):
        cmd = f"lcdclear({color})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success
    
    def Palette(self, id:int, color: int) -> bool:
        if id > 16:
            raise ValueError("Palette supports 16 color index only.")

        self.__palette[id] = color
        cmd = f"palette({id},{color})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success
    
    def PaletteFromBuffer(self, pixels, bucketDepth: int = 8) -> bool:
        paletteBuilder = PaletteBuilder(3)
        palette = paletteBuilder.BuildPalette(pixels)
        for i in range(0, len(palette)):
            if not self.Palette(i, palette[i]):
                return False
        return True

    def SetPixel(self, color, x, y):
        cmd = f"lcdpixel({color},{x},{y})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def DrawCircle(self, color, x, y, radius):
        cmd = f"lcdcircle({color},{x},{y},{radius})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def DrawRectangle(self, color, x, y, width, height):
        cmd = f"lcdrect({color},{x},{y},{width},{height})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success
    
    def DrawFillRect(self, color, x, y, width, height):
        cmd = f"lcdfill({color},{x},{y},{width},{height})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def DrawLine(self, color, x1, y1, x2, y2):
        cmd = f"lcdline({color},{x1},{y1},{x2},{y2})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def DrawText(self, text, color, x, y):
        cmd = f"lcdtext(\"{text}\",{color},{x},{y})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def DrawTextScale(self, text, color, x, y, scalewidth, scaleheight):
        cmd = f"lcdtexts(\"{text}\",{color},{x},{y},{scalewidth},{scaleheight})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()
        return res.success

    def __Stream(self, data, color_depth:int):
        cmd = f"lcdstream({color_depth})"
        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()

        if res.success:
            self.serialPort.WriteRawData(data, 0, len(data))
            # time.sleep(10)
            res = self.serialPort.ReadRespone()

        return res.success
    
    def __ColorDistance(self, color1, color2):
        r1 = (color1 >> 16) & 0xff
        g1 = (color1 >> 8) & 0xff
        b1 = (color1 >> 0) & 0xff

        r2 = (color2 >> 16) & 0xff
        g2 = (color2 >> 8) & 0xff
        b2 = (color2 >> 0) & 0xff

        rd = (r1 - r2) * (r1 - r2)
        gd = (g1 - g2) * (g1 - g2)
        bd = (b1 - b2) * (b1 - b2)
        return rd+gd+bd
    
    def __PaletteLookup(self, color):
        bestDistance = self.__ColorDistance(self.__palette[0], color)
        bestEntry = 0
        
        for i in range(0, len(self.__palette)):
            distance = self.__ColorDistance(self.__palette[i], color)
            if distance < bestDistance:
                bestDistance = distance;
                bestEntry = i;
        
        return bestEntry;
    
    def DrawBuffer(self, bitmap, color_depth) -> bool:
        if bitmap is None:
            raise ValueError("Bitmap array is null")        
            
        if (self.Configuration.Type == DisplayType.BuiltIn) :
            if (self.serialPort.DeviceConfig.IsPulse and color_depth != 1):
                raise Exception("BuiltIn support one bit only")
            
                
        
        width = self.Width
        height = self.Height

        buffer_size = 0
        i = 0
        buffer = None

        match color_depth:
            case 1:
                if (self.Configuration.Type == DisplayType.SSD1306 or (self.Configuration.Type == DisplayType.BuiltIn and self.serialPort.DeviceConfig.IsPulse)):
                    buffer_size = int(width * height/8)
                    buffer = bytearray(buffer_size)

                    for y in range(0, height):
                        for x in range(0, width):
                            index = (y >> 3) * width + x
                            red = bitmap[i]
                            green = bitmap[i+1]
                            blue = bitmap[i+2]
                            
                            if red + green + blue > 0:
                                buffer[index] |= (1 << (y & 7)) & 0xFF
                            else:
                                buffer[index] &= (~(1 << (y & 7))) & 0xFF
                                
                            i += 4 
                else:
                    buffer_size = int(width * height/8)
                    buffer = bytearray(buffer_size)
                    data = 0
                    i = 0
                    bit = 0
                    j = 0

                    for y in range(0, height):
                        for x in range(0, width):
                            red = bitmap[i]
                            green = bitmap[i + 1]
                            blue = bitmap[i + 2]
                            clr = ((red << 16) | (green << 8) | blue)

                            if (clr != 0):
                                data |= (1 << bit)
                            
                            bit +=1

                            if (bit == 8):
                                buffer[j] = data
                                j +=1

                                bit = 0
                                data = 0
                            
                            i += 4
                            
                        
                    

            case 4:
                buffer_size = int(width * height / 2)
                buffer = bytearray(buffer_size)

                for j in range(0, buffer_size):
                    red = bitmap[i]
                    green = bitmap[i+1]
                    blue = bitmap[i+2]
                    pixel1 = (red << 16) | (green << 8) | blue

                    red = bitmap[i+4]
                    green = bitmap[i+4+1]
                    blue = bitmap[i+4+2]
                    pixel2 = (red << 16) | (green << 8) | blue

                    buffer[j] = (self.__PaletteLookup(pixel1) << 4) | self.__PaletteLookup(pixel2)

                    i += 8

            case 8:
                buffer_size = int(width * height)
                buffer = bytearray(buffer_size)

                for j in range(0, buffer_size):
                    red = bitmap[i]
                    green = bitmap[i+1]
                    blue = bitmap[i+2]
                    buffer[j] = ((red >> 5) << 5) | ((green >> 5) << 2) | (blue >> 6)
                    i += 4

            case 16:
                buffer_size = int(width * height * 2);
                buffer = bytearray(buffer_size)

                for y in range(0, height):
                    for x in range(0, width):
                        index = (y * width + x) * 2
                        red = bitmap[i+0]
                        green = bitmap[i+1]
                        blue = bitmap[i+2]
                        clr = (red << 16) | (green << 8) |  blue

                        buffer[index + 0] = (((clr & 0b0000_0000_0000_0000_0001_1100_0000_0000) >> 5) | ((clr & 0b0000_0000_0000_0000_0000_0000_1111_1000) >> 3)) & 0xff
                        buffer[index + 1] = (((clr & 0b0000_0000_1111_1000_0000_0000_0000_0000) >> 16) | ((clr & 0b0000_0000_0000_0000_1110_0000_0000_0000) >> 13)) & 0xff
                        i += 4

            case _:
                raise ValueError("Invalid color depth")
            
        return self.__Stream(buffer, color_depth)
        

    def DrawImageScale(self, img, x: int, y: int, scaleWidth: int, scaleHeight: int,  transform: int) -> bool:        
        
        width = img[0]
        height = img[1]

        if width <=0 or height <=0 or len(img) < width*height:
            raise Exception("Invalid arguments")

        cmd = f"dim a[{len(img)}]"

        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()

        
        for i in range(len(img)):
            cmd = f"a[{(i)}] = {img[i]}"
            self.serialPort.WriteCommand(cmd)
            res = self.serialPort.ReadRespone()

            if (res.success == False):
                break
        
        if (res.success == True):
            cmd = f"lcdimgs(a, {x}, {y}, {scaleWidth}, {scaleHeight}, {transform})"

            self.serialPort.WriteCommand(cmd)
            res = self.serialPort.ReadRespone()
        

        cmd = "dim a[0]"

        self.serialPort.WriteCommand(cmd)
        res = self.serialPort.ReadRespone()

        return res.success 

    def DrawImage(self, img, x: int, y: int, transform: int) -> bool:
        return self.DrawImageScale(img, x, y, 1, 1, transform)
    
    #def CreateImage(self, data, width: int, height: int):
    #    if width <=0 or height <=0 or len(data) < width*height:
    #        raise Exception("Invalid arguments")
        
    #    self.DataImg = [0] * (width * height + 2)

    #    self.DataImg[0] = width
    #    self.DataImg[1] = height

    #    for i in range (width * height):
    #        self.DataImg[2 + i] = data[i]

    #    return self.DataImg

    #def DrawImageBytes(self, data, offset: int, length: int, x: int, y: int, width: int, scaleWidth: int, scaleHeight: int,  transform: int) -> bool:
    #    if length % 4 !=0:
    #        raise Exception("length must be multiple of 4")
        
    #    data32 = [0] * int(length/4)

    #    for i in range (0, len(data32), 4):
    #        data32[i] = (data[(i + offset) * 4 + 0] << 0) | (data[(i + offset) * 4 + 1] << 8) | (data[(i + offset) * 4 + 2] << 16) | (data[(i + offset) * 4 + 3] << 24)

    #    return self.DrawImage(data32, 0, len(data32),x, y, width, scaleWidth, scaleHeight, transform)
    
    def __get_transform_none(self):
        return 0
    def __get_transform_fliphorizontal(self):
        return 1
    def __get_transform_flipvertical(self):
        return 2
    def __get_transform_rotate90(self):
        return 3
    def __get_transform_rotate180(self):
        return 4
    def __get_transform_rotate270(self):
        return 5
    def __set_transform(self):
        return 
    
    TransformNone = property(__get_transform_none, __set_transform)  
    TransformFlipHorizontal = property(__get_transform_fliphorizontal, __set_transform) 
    TransformFlipVertical = property(__get_transform_flipvertical, __set_transform) 
    TransformRotate90 = property(__get_transform_rotate90, __set_transform) 
    TransformRotate180 = property(__get_transform_rotate180, __set_transform) 
    TransformRotate270 = property(__get_transform_rotate270, __set_transform) 

class PaletteBuilder:
    def __init__(self, bucketsPerChannel: int):
        ValuesPerChannel = 256
        if bucketsPerChannel < 1 or bucketsPerChannel > ValuesPerChannel:
            raise ValueError(f"Buckets per channel must be between 1 and {ValuesPerChannel}")
        self.__bucketSize = ValuesPerChannel / bucketsPerChannel

    def BuildPalette(self, pixels):
        histogram = dict()

        for i in range(0, len(pixels), 4):
            pixel = ((pixels[i]) << 16) | (pixels[i+1] << 8) | pixels[i+2]
            key = self.__CreateColorKey(pixels[i], pixels[i+1], pixels[i+2])
            if key in histogram:
                histogram[key].append(pixel)
            else:
                histogram[key] = [pixel]

        sortedBuckets = list(histogram.values())
        sortedBuckets.sort(reverse=True, key=lambda e : len(e))

        palette = []
        for i in range(0, 16):
            palette.append(self.__AverageColor(sortedBuckets[i % len(sortedBuckets)]))
        return palette
    
    def __AverageColor(self, colors):
        r = 0
        g = 0
        b = 0
        for color in colors:
            r += ((color >> 16) & 0xff)
            g += ((color >> 8) & 0xff)
            b += ((color >> 0) & 0xff)
        count = len(colors)
        r = int(r/count)
        g = int(g/count)
        b = int(b/count)
        return (r<<16) | (g<<8) | b

    def __CreateColorKey(self, r, g, b):
        redBucket = int(r / self.__bucketSize)
        greenBucket = int(g / self.__bucketSize)
        blueBucket = int(b / self.__bucketSize)
        return (redBucket << 16) | (greenBucket << 8) | blueBucket


        



        
    
