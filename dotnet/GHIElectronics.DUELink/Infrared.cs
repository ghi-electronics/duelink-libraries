using System;
using System.Buffers;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class InfraredController {

            SerialInterface serialPort;

            public InfraredController(SerialInterface serialPort) => this.serialPort = serialPort;

            public int Read() {
                var cmd = "log(irread())";
                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();
                var val = 255;
                if (res.success) {
                   

                    try {
                        val = int.Parse(res.respone);
                    }
                    catch { }
                }

                return val;

            }

            //public bool Clear() {
            //    var cmd = "R" + " " + "C";

            //    this.serialPort.WriteLine(cmd);

            //    var res = this.serialPort.ReadRespone();

            //    if (res.success) {
            //        return true;
            //    }

            //    return false;
            //}

            public bool Enable(int pin, bool enable) {
                if (pin != 2 && pin != 8)
                    throw new Exception("IR is only available on pin 2 and 8");

                var cmd = string.Format("irenable({0}, {1})", pin, enable == true?1:0);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                if (res.success) {
                    return true;
                }

                return false;
            }

        }
    }
}
