using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUE {

    public partial class DUEController {
        public class NeoController {

            SerialInterface serialPort;

            public const int MAX_LED_NUM = 256;

            public NeoController(SerialInterface serialPort) => this.serialPort = serialPort;

            public bool Show(int count) {
                var cmd = string.Format("neoshow({0})", count.ToString());
                this.serialPort.WriteCommand(cmd);

                // each led ned 1.25us delay blocking mode
                var delay = (MAX_LED_NUM * 3 * 8 * 1.25) / 1000;

                Thread.Sleep((int)delay);

                var res = this.serialPort.ReadRespone();

                return res.success;

            }

            public bool Clear() {
                var cmd = string.Format("neoclear()");
                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;

            }

            //private bool SetColor(int id, byte red, byte green, byte blue) {
            //    if (id < 0 || id > MAX_LED_NUM) {
            //        return false;
            //    }
            //    var cmd = string.Format("neoset({0},{1},{2},{3})", id.ToString(), red.ToString(), green.ToString(), blue.ToString());


            //    this.serialPort.WriteCommand(cmd);

            //    var res = this.serialPort.ReadRespone();

            //    return res.success;
            //}

            //public bool Stream(byte[] data) {
            //    if (data.Length > MAX_LED_NUM * 3) {
            //        return false;
            //    }

            //    var cmd = string.Format("neostream({0})", data.Length.ToString());

            //    this.serialPort.WriteCommand(cmd);

            //    var res = this.serialPort.ReadRespone();

            //    if (res.success) {

            //        this.serialPort.WriteRawData(data, 0, data.Length);

            //        res = this.serialPort.ReadRespone();
            //    }

            //    return res.success;
            //}

            public bool SetColor(int id, uint color) {
                var red = (byte)((color >> 16) & 0xff);
                var green = (byte)((color >> 8) & 0xff);
                var blue = (byte)((color >> 0) & 0xff);

                //return this.SetColor(id, red, green, blue);

                if (id < 0 || id > MAX_LED_NUM) {
                    return false;
                }
                var cmd = string.Format("neoset({0},{1},{2},{3})", id.ToString(), red.ToString(), green.ToString(), blue.ToString());


                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;
            }

            public bool SetMultiple(uint[] color, int offset, int length) {
                if (length > MAX_LED_NUM) {
                    return false;
                }

                var data = new byte[length *  3];

                for (int i = offset; i < length; i++) {
                    data[(i - offset) * 3 + 0 ] = (byte)((color[i] >> 16) & 0xff);
                    data[(i - offset) * 3 + 1 ] = (byte)((color[i] >> 8) & 0xff);
                    data[(i - offset) * 3 + 2 ] = (byte)((color[i] >> 0) & 0xff);
                }

                var cmd = string.Format("neostream({0})", data.Length.ToString());

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                if (res.success) {

                    this.serialPort.WriteRawData(data, 0, data.Length);

                    res = this.serialPort.ReadRespone();
                }

                return res.success;
            }

            public int SupportLedNumMax { get; } = MAX_LED_NUM;

        }
    }
}
