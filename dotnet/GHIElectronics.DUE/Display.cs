using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUE {

    public partial class DUEController {
        public class DisplayController {

            SerialInterface serialPort;



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
            public bool DrawTextScale (string text, uint color, int x, int y, int scalewidth, int scaleheight) {
                var cmd = string.Format("lcdtexts(\"{0}\",{1},{2},{3},{4},{5})", text, color, x, y, scalewidth, scaleheight);


                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;

            }

            private bool Stream(byte[] data) {
                var cmd = string.Format("lcdstream()");

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                if (res.success) {

                    this.serialPort.WriteRawData(data, 0, data.Length);

                    //Thread.Sleep(10);

                    res = this.serialPort.ReadRespone();
                }

                return res.success;

            }

            public bool DrawBuffer(uint[] color, int offset, int length) {
                const int WIDTH = 128;
                const int HEIGHT = 64;

                if (length > WIDTH * HEIGHT)
                    throw new Exception("Only 64*128 supported.");

               

                var data = new byte[WIDTH * HEIGHT / 8];
                var i = 0;

                for (int y = 0; y < HEIGHT; y++) {
                    for (int x = 0; x < WIDTH; x++) {

                        var index = (y >> 3) * WIDTH + x;

                        if ((color[i] & 0x00FFFFFF) != 0) { // no alpha
                            data[index] |= (byte)(1 << (y & 7));
                        }
                        else {
                            data[index] &= (byte)(~(1 << (y & 7)));
                        }
                        i++;
                    }
                }

                return Stream(data);

            }



        }

    }
}
