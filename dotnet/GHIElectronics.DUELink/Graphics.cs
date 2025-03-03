using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.Linq;
using System.Runtime.ConstrainedExecution;
using System.Text;
using System.Threading.Tasks;
using static GHIElectronics.DUELink.DUELinkController;

namespace GHIElectronics.DUELink {

    public partial class DUELinkController {
        public class GraphicsController {
            SerialInterface serialPort;
           

            public GraphicsController(SerialInterface serialPort) {
                this.serialPort = serialPort; ;
                
            }

            public void Gfxcfg(DisplayType displayType, byte[] config, int width, int height, int mode) {

                //var cmd_dim_array = string.Format("dim b1[{0}]", config.Length);

                //this.serialPort.WriteCommand(cmd_dim_array);

                //var res = this.serialPort.ReadRespone();

                //for (var i = 0; i < config.Length; i++) {
                //    cmd_dim_array = string.Format("b1[{0}] = {1}", (i), config[i]);

                //    this.serialPort.WriteCommand(cmd_dim_array);

                //    res = this.serialPort.ReadRespone();

                //    if (!res.success) {
                //        break;
                //    }
                //}

                //cmd_dim_array = string.Format("dim b1[0]");

                //this.serialPort.WriteCommand(cmd_dim_array);

                //res = this.serialPort.ReadRespone();

                var config_array = string.Empty;

                config_array = "[";

                for (var i = 0; i < config.Length; i++) {
                    config_array += config[i];

                    if (i < config.Length - 1)
                        config_array += ",";
                }

                config_array += "]";

                var cmd = string.Format($"gfxcfg({displayType.ToString()}, {config_array}, {width}, {height}, {mode})");

            }

            public bool Show() {
                var cmd = string.Format("show()");

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;
            }

            public bool Clear(uint color) {
                var cmd = string.Format("clear({0})", color);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;

            }

            

            

            public bool Pixel(uint color, int x, int y) {

                var cmd = string.Format("pixel({0},{1},{2})", color, x, y);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;
            }


            public bool Circle(uint color, int x, int y, int radius) {

                var cmd = string.Format("circle({0},{1},{2},{3})", color, x, y, radius);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;
            }

            public bool Rect(uint color, int x, int y, int width, int height) {

                var cmd = string.Format("rect({0},{1},{2},{3},{4})", color, x, y, width, height);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;
            }

            public bool Fill(uint color, int x, int y, int width, int height) {
                var cmd = string.Format("fill({0},{1},{2},{3},{4})", color, x, y, width, height);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;
            }

            public bool Line(uint color, int x1, int y1, int x2, int y2) {

                var cmd = string.Format("line({0},{1},{2},{3},{4})", color, x1, y1, x2, y2);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;
            }

            public bool Text(string text, uint color, int x, int y) {
                var cmd = string.Format("text(\"{0}\",{1},{2},{3})", text, color, x, y);


                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;

            }
            public bool TextS(string text, uint color, int x, int y, int scalewidth, int scaleheight) {
                var cmd = string.Format("texts(\"{0}\",{1},{2},{3},{4},{5})", text, color, x, y, scalewidth, scaleheight);


                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;

            }

            public bool TextT(string text, uint color, int x, int y) {
                var cmd = string.Format("textT(\"{0}\",{1},{2},{3})", text, color, x, y);


                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;

            }
            public bool DrawImage(uint[] img, int x, int y, int w, int h, int transform) => this.DrawImageScale(img, x, y, w, h, 1, 1, transform);
            public bool DrawImageScale(uint[] img, int x, int y, int width, int height, int scaleWidth, int scaleHeight, int transform) {

                if (img == null) {
                    throw new ArgumentNullException("Data null.");
                }

                if (width == 0 || height == 0 || img == null || img.Length < (width * height)) {
                    throw new ArgumentException("Invalid argument.");
                }

                //var cmd = string.Format("dim b1[{0}]", img.Length);

                //this.serialPort.WriteCommand(cmd);

                //var res = this.serialPort.ReadRespone();

                //for (var i = 0; i < img.Length; i++) {
                //    cmd = string.Format("b1[{0}] = {1}", (i), img[i]);

                //    this.serialPort.WriteCommand(cmd);

                //    res = this.serialPort.ReadRespone();

                //    if (!res.success) {
                //        break;
                //    }
                //}

                var img_array = string.Empty;

                img_array = "[";

                for (var i = 0; i < img.Length; i++) {
                    img_array += img[i];

                    if (i < img.Length - 1)
                        img_array += ",";
                }

                img_array += "]";

                var cmd = $"imgs({img_array}, {x}, {y}, {width}, {height}, {scaleWidth}, {scaleHeight}, {transform})";

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;

            }



          


            

        }
    }

    public enum DisplayType {
        I2C = 1,
        SPI = 2,
        Neo = 3,
        Matrix5x5 = 4,
    }
   



    
}
