using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.Linq;
using System.Runtime.ConstrainedExecution;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {

    public partial class DUELinkController {
        public class DisplayController {
            SerialInterface serialPort;

            public int TransformNone { get; } = 0;
            public int TransformFlipHorizontal { get; } = 1;
            public int TransformFlipVertical { get; } = 2;
            public int TransformRotate90 { get; } = 3;
            public int TransformRotate180 { get; } = 4;
            public int TransformRotate270 { get; } = 5;

            public int Width { get; private set; } = 128;
            public int Height { get; private set; } = 64;

            private uint[] _palette = new uint[]{
                0x000000, // Black  
                0xFFFFFF, // White  
                0xFF0000, // Red    
                0x32CD32, // Lime   
                0x0000FF, // Blue   
                0xFFFF00, // Yellow 
                0x00FFFF, // Cyan   
                0xFF00FF, // Magenta
                0xC0C0C0, // Silver 
                0x808080, // Gray   
                0x800000, // Maroon 
                0xBAB86C, // Oliver 
                0x00FF00, // Green  
                0xA020F0, // Purple 
                0x008080, // Teal   
                0x000080, // Navy   
            };

            public DisplayController(SerialInterface serialPort) {
                this.serialPort = serialPort;

                if (this.serialPort.DeviceConfig.IsRave) {
                    Width = 160;
                    Height = 120;
                }
            }

            public bool Show() {
                var cmd = string.Format("lcdshow()");

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;
            }

            public bool Clear(uint color) {
                var cmd = string.Format("lcdclear({0})", color);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;

            }

            public bool Palette(int id, uint color) {
                if (id >= 16)
                    throw new ArgumentOutOfRangeException("Palette supports 16 color index only.");

                _palette[id] = color;
                var cmd = string.Format("palette({0},{1})", id.ToString(), color.ToString());

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();
                return res.success;

            }

            public bool PaletteFromBuffer(byte[] pixels, int bucketDepth = 8)
            {
                var builder = new PaletteBuilder(bucketDepth);
                var palette = builder.BuildPalette(pixels);
                for (int i = 0; i < palette.Length; i++) {
                    if (!Palette(i, palette[i])) {
                        return false;
                    }
                }
                return true;
            }

            public bool SetPixel(uint color, int x, int y) {

                var cmd = string.Format("lcdpixel({0},{1},{2})", color, x, y);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;
            }


            public bool DrawCircle(uint color, int x, int y, int radius) {

                var cmd = string.Format("lcdcircle({0},{1},{2},{3})", color, x, y, radius);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;
            }

            public bool DrawRectangle(uint color, int x, int y, int width, int height) {

                var cmd = string.Format("lcdrect({0},{1},{2},{3},{4})", color, x, y, width, height);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;
            }

            public bool DrawFillRect(uint color, int x, int y, int width, int height) {
                var cmd = string.Format("lcdfill({0},{1},{2},{3},{4})", color, x, y, width, height);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;
            }

            public bool DrawLine(uint color, int x1, int y1, int x2, int y2) {

                var cmd = string.Format("lcdline({0},{1},{2},{3},{4})", color, x1, y1, x2, y2);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;
            }

            public bool DrawText(string text, uint color, int x, int y) {
                var cmd = string.Format("lcdtext(\"{0}\",{1},{2},{3})", text, color, x, y);


                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;

            }
            public bool DrawTextScale(string text, uint color, int x, int y, int scalewidth, int scaleheight) {
                var cmd = string.Format("lcdtexts(\"{0}\",{1},{2},{3},{4},{5})", text, color, x, y, scalewidth, scaleheight);


                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;

            }
            public bool DrawImage(uint[] img, int x, int y, int transform) => this.DrawImageScale(img, x, y, 1, 1, transform);
            public bool DrawImageScale(uint[] img, int x, int y, int scaleWidth, int scaleHeight, int transform) {

                if (img == null) {
                    throw new ArgumentNullException("Data null.");
                }

                var width = img[0];
                var height = img[1];

                if (width == 0 || height == 0 || img == null || img.Length < (width * height)) {
                    throw new ArgumentException("Invalid argument.");
                }

                var cmd = string.Format("dim a[{0}]", img.Length);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                for (var i = 0; i < img.Length; i++) {
                    cmd = string.Format("a[{0}] = {1}", (i), img[i]);

                    this.serialPort.WriteCommand(cmd);

                    res = this.serialPort.ReadRespone();

                    if (!res.success) {
                        break;
                    }
                }

                if (res.success) {
                    cmd = string.Format("lcdimgs(a, {0}, {1}, {2}, {3}, {4})", x, y, scaleWidth, scaleHeight, transform);

                    this.serialPort.WriteCommand(cmd);

                    res = this.serialPort.ReadRespone();
                }


                cmd = string.Format("dim a[0]"); // free array

                this.serialPort.WriteCommand(cmd);

                res = this.serialPort.ReadRespone();

                return res.success;

            }

            //public bool DrawImageBytes(byte[] data, int offset, int length, int x, int y, int width, int scaleWidth, int scaleHeight, int transform) {
            //    if (length % 4 != 0) {

            //        throw new Exception("length must be multiple of 4");
            //    }

            //    var data32 = new uint[length / 4];

            //    for (var i = 0; i < data32.Length; i++) {
            //        data32[i] = BitConverter.ToUInt32(data, (i + offset) * 4);
            //    }

            //    return this.DrawImage(data32, 0, data32.Length, x, y, width, scaleWidth, scaleHeight, transform);

            //}

            private bool Stream(byte[] data, int color_depth) {
                var cmd = string.Format("lcdstream({0})", color_depth);
                
                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                if (res.success) {

                    this.serialPort.WriteRawData(data, 0, data.Length);

                    //Thread.Sleep(10);

                    res = this.serialPort.ReadRespone();
                }

                return res.success;

            }

            public bool DrawBuffer(uint[] color) {
                //TODO: Need to be rewrite with SPI supported

                return false;                

            }

            private int ColorDistance(uint color1, uint color2)
            {
                int r1 = (int)((color1 >> 16) & 0xff);
                int g1 = (int)((color1 >> 8) & 0xff);
                int b1 = (int)((color1 >> 0) & 0xff);

                int r2 = (int)((color2 >> 16) & 0xff);
                int g2 = (int)((color2 >> 8) & 0xff);
                int b2 = (int)((color2 >> 0) & 0xff);

                int rd = (r1 - r2) * (r1 - r2);
                int gd = (g1 - g2) * (g1 - g2);
                int bd = (b1 - b2) * (b1 - b2);
                return rd+gd+bd;
            }

            private byte PaletteLookup(uint color)
            {
                var bestDistance = ColorDistance(this._palette[0], color);
                byte bestEntry = 0;
                for(byte i=1 ; i < this._palette.Length; i++)
                {
                    var distance = ColorDistance(this._palette[i], color);
                    if (distance < bestDistance)
                    {
                        bestDistance = distance;
                        bestEntry = i;
                    }
                }
                return bestEntry;
            }


            // This function for testing firmware that support 1,4,8,16bit
            public void DrawBuffer(byte[] bitmap, int color_depth) {
                if (bitmap == null) {
                    throw new Exception("Bitmap array is null");
                }

                var width = this.Width;
                var height = this.Height;

                var buffer_size = 0;
                var i = 0;
                var buffer = Array.Empty<byte>();
            

                switch (color_depth) {
                    case 1:
                        buffer_size = width * height / 8;
                        buffer = new byte[buffer_size];

                        for (int y = 0; y < height; y++) {
                            for (int x = 0; x < width; x++) {
                                var index = (y >> 3) * width + x;

                                var red = bitmap[i];
                                var green = bitmap[i + 1];
                                var blue = bitmap[i + 2];
                                var brightness = (red + green + blue) / 3;

                                if (brightness > 127) {
                                    buffer[index] |= (byte)(1 << (y & 7));
                                }
                                else {
                                    buffer[index] &= (byte)(~(1 << (y & 7)));
                                }

                                i += 4;                                
                            }
                        }
                        break;

                    case 4:
                        buffer_size = width * height / 2;
                        buffer = new byte[buffer_size];

                        for (var j = 0; j < buffer.Length; j++) {
                            var red = bitmap[i];
                            var green = bitmap[i + 1];
                            var blue = bitmap[i + 2];
                            var pixel1 = (uint)((red << 16) | (green << 8) | blue);

                            red = bitmap[i + 4];
                            green = bitmap[i + 4 + 1];
                            blue = bitmap[i + 4 + 2];
                            var pixel2 = (uint)((red << 16) | (green << 8) | blue);

                            buffer[j] = (byte)((PaletteLookup(pixel1) << 4) | PaletteLookup(pixel2));
                            i += 8;
                        }
                        break;

                    case 8:
                        buffer_size = width * height;
                        buffer = new byte[buffer_size];

                        for (var j = 0; j < buffer.Length; j++) {
                            var red = bitmap[i];
                            var green = bitmap[i + 1];
                            var blue = bitmap[i + 2];

                            buffer[j] = (byte)(((red >> 5) << 5) | ((green >> 5) << 2) | (blue >> 6));
                            i += 4;
                        }
                        break;

                    case 16:
                        buffer_size = width * height * 2;

                        buffer = new byte[buffer_size];


                        i = 0;
                        for (var y = 0; y < height; y++) {
                            for (var x = 0; x < width; x++) {
                                var index = (y * width + x) * 2;
                                var red = bitmap[i];
                                var green = bitmap[i + 1];
                                var blue = bitmap[i + 2];
                                var clr = (uint)((red << 16) | (green << 8) | blue);

                                buffer[index + 0] = (byte)(((clr & 0b0000_0000_0000_0000_0001_1100_0000_0000) >> 5) | ((clr & 0b0000_0000_0000_0000_0000_0000_1111_1000) >> 3));
                                buffer[index + 1] = (byte)(((clr & 0b0000_0000_1111_1000_0000_0000_0000_0000) >> 16) | ((clr & 0b0000_0000_0000_0000_1110_0000_0000_0000) >> 13));
                                i += 4;
                            }
                        }

                        break;
                    default:
                        throw new ArgumentException("Invalid color depth", nameof(color_depth));
                }

                if (buffer != null) {

                    this.Stream(buffer, color_depth);
                }

            
            }

            public byte[] BufferFrom(Image image) {
                var bmp = new Bitmap(this.Width, this.Height);
                var g = Graphics.FromImage(bmp);
                g.DrawImage(image, 0, 0, this.Width, this.Height);

                byte[] pixels = new byte[this.Width * this.Height * 4];

                var bmpData = bmp.LockBits(new Rectangle(0, 0, bmp.Width, bmp.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
                unsafe {
                    var ptr = (byte*)bmpData.Scan0.ToPointer();
                    for (int y = 0; y < bmpData.Height; y++) {
                        for (int x = 0; x < bmpData.Width * 4; x += 4) {
                            pixels[y * bmpData.Width * 4 + x] = ptr[y * bmpData.Stride + x + 2];        // Red
                            pixels[y * bmpData.Width * 4 + x + 1] = ptr[y * bmpData.Stride + x + 1];    // Green
                            pixels[y * bmpData.Width * 4 + x + 2] = ptr[y * bmpData.Stride + x];        // Blue
                        }
                    }
                }
                bmp.UnlockBits(bmpData);
                return pixels;
            }

            public bool DrawBufferBytes(byte[] color) {

                if (color == null) {
                    throw new Exception("color can not be null.");
                }

                int offset = 0;
                int length = color.Length;

                if (length % 4 != 0) {

                    throw new Exception("length must be multiple of 4");
                }

                var data32 = new uint[length / 4];

                for (var i = 0; i < data32.Length; i++) {
                    data32[i] = BitConverter.ToUInt32(color, (i + offset) * 4);
                }

                return this.DrawBuffer(data32);


            }

            public bool Configuration(int target, uint param) {
                var cmd = string.Format("lcdconfig({0},{1})", target, param);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;
            }

            //public uint[] CreateImage(uint[] data, uint width, uint height) {
            //    if (width == 0 || height == 0 || data == null || data.Length < (width * height)) {
            //        throw new ArgumentException("Invalid argument.");
            //    }

            //    var buffer = new uint[width * height + 2];

            //    buffer[0] = width;
            //    buffer[1] = height;

            //    Array.Copy(data, 0, buffer, 2, width * height);

            //    return buffer;
            //}
        }
    }

    class PaletteBuilder {
        private const int ValuesPerChannel = 256;
        private int _bucketSize;

        public PaletteBuilder(int bucketsPerChannel) {
            if (bucketsPerChannel < 1 || bucketsPerChannel > ValuesPerChannel) {
                throw new ArgumentException($"Must be between 1 and {ValuesPerChannel}", nameof(bucketsPerChannel));
            }

            _bucketSize = ValuesPerChannel / bucketsPerChannel;
        }

        public uint[] BuildPalette(byte[] pixels) {
            var histogram = new Dictionary<uint, List<uint>>();
            for(var i = 0; i < pixels.Length; i += 4) {
                var pixel = (uint)(((pixels[i]) << 16) | (pixels[i + 1] << 8) | pixels[i + 2]);
                var key = CreateColorKey(pixel);
                if (!histogram.TryGetValue(key, out var colors)) {
                    colors = new List<uint>();
                    histogram[key] = colors;
                }
                colors.Add(pixel);
            }

            var sortedBuckets = (from e in histogram
                                 orderby e.Value.Count descending
                                 select e).ToArray();

            var palette = new uint[16];
            for (int i = 0; i < 16; i++) {
                palette[i] = AverageColor(sortedBuckets[i % sortedBuckets.Length].Value);
            }
            return palette;
        }

        private static uint AverageColor(IEnumerable<uint> colors) {
            uint r = 0;
            uint g = 0;
            uint b = 0;
            foreach (var color in colors) {
                r += ((color >> 16) & 0xff);
                g += ((color >> 8) & 0xff);
                b += ((color >> 0) & 0xff);
            }
            var count = (uint)colors.Count();
            r /= count;
            g /= count;
            b /= count;
            return (r & 0xff) << 16 | (g & 0xff) << 8 | b & 0xff;
        }

        private uint CreateColorKey(uint color) {
            var redBucket = ((color >> 16) & 0xff) / _bucketSize;
            var greenBucket = ((color >> 8) & 0xff) / _bucketSize;
            var blueBucket = ((color >> 0) & 0xff) / _bucketSize;
            return (uint)((redBucket << 16) | (greenBucket << 8) | blueBucket);
        }
    }
}
