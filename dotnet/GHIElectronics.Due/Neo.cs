using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.Due {

    public partial class DueController {
        public class NeoController {

            SerialInterface serialPort;

            public const int MAX_LED_NUM = 256;

            public NeoController(SerialInterface serialPort) => this.serialPort = serialPort;

            public bool Show(int count) {
                var cmd = string.Format("neoshow({0})", count.ToString());
                this.serialPort.WriteLine(cmd);

                // each led ned 1.25us delay blocking mode
                var delay = (MAX_LED_NUM * 3 * 8 * 1.25) / 1000;

                Thread.Sleep((int)delay);

                var res = this.serialPort.ReadRespone();

                return res.success;

            }

            public bool Clear() {
                var cmd = string.Format("neoclear()");
                this.serialPort.WriteLine(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;

            }

            public bool SetColor(int id, byte red, byte green, byte blue) {
                if (id < 0 || id > MAX_LED_NUM) {
                    return false;
                }
                var cmd = string.Format("neoset({0},{1},{2},{3})", id.ToString(), red.ToString(), green.ToString(), blue.ToString());


                this.serialPort.WriteLine(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;
            }

            public bool Stream(byte[] data) {
                if (data.Length > MAX_LED_NUM * 3) {
                    return false;
                }

                var cmd = string.Format("neostream({0})", data.Length.ToString());

                this.serialPort.WriteLine(cmd);

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
