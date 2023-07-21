using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static System.Net.Mime.MediaTypeNames;

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


            public DisplayController(SerialInterface serialPort) => this.serialPort = serialPort;

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

            // This function for testing firmware that support 1,4,8,16bit
            public void DrawBuffer(uint[] bitmap, int color_depth) {
                if (bitmap == null) {
                    throw new Exception("Bitmap array is null");
                }
                // todo: get width from config
                var width = 128;
                var height = 64;

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

                                
                                if ((bitmap[i] & 0x00FFFFFF) != 0) { // no alpha
                                    buffer[index] |= (byte)(1 << (y & 7));
                                }
                                else {
                                    buffer[index] &= (byte)(~(1 << (y & 7)));
                                }
                                i++;
                                
                            }
                        }

                        break;

                    case 4:
                        buffer_size = width * height / 2;

                        buffer = new byte[buffer_size];

                        for (i = 0; i < buffer.Length; i++) {
                            buffer[i] = (byte)((bitmap[i * 2] << 4) | bitmap[i * 2 + 1]);
                        }

                        break;

                    case 8:
                        buffer_size = width * height;

                        buffer = new byte[buffer_size];


                        for (i = 0; i < buffer.Length; i++) {
                            var clr = bitmap[i];

                            var red = (clr >> 16) & 0xFF;
                            var green = (clr >> 8) & 0xFF;
                            var blue = (clr >> 0) & 0xFF;

                            red = red >> 5;
                            green = green >> 5;
                            blue = blue >> 6;

                            buffer[i] = (byte)((red << 5) | green << 3 | blue);
                        }

                        break;

                    default:
                        buffer_size = width * height * 2;

                        buffer = new byte[buffer_size];


                        i = 0;
                        for (var y = 0; y < height; y++) {
                            for (var x = 0; x < width; x++) {

                                var index = (y * width + x) * 2;
                                var clr = bitmap[i];

                                buffer[index + 0] = (byte)(((clr & 0b0000_0000_0000_0000_0001_1100_0000_0000) >> 5) | ((clr & 0b0000_0000_0000_0000_0000_0000_1111_1000) >> 3));
                                buffer[index + 1] = (byte)(((clr & 0b0000_0000_1111_1000_0000_0000_0000_0000) >> 16) | ((clr & 0b0000_0000_0000_0000_1110_0000_0000_0000) >> 13));
                                i++;

                            }
                        }

                        

                        break;
                }

                if (buffer != null) {

                    this.Stream(buffer, color_depth);
                }


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
}
