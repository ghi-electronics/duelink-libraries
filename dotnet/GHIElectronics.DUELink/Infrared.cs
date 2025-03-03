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
                var cmd = "irread()";
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



            public bool Enable(int pin, bool enable) {
                if (pin != 0)
                    throw new Exception("IR is only available on pin 0");

                var cmd = string.Format("iren({0}, {1})", pin, enable?1:0);

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
