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

                var res = this.serialPort.ReadResponse();
                var val = 255;
                if (res.success) {
                   

                    try {
                        val = int.Parse(res.response);
                    }
                    catch { }
                }

                return val;

            }

            public bool Write(byte data) {
                var cmd = string.Format("IrWrite({0})", data);
                this.serialPort.WriteCommand(cmd);

                var ret = this.serialPort.ReadResponse();

                return ret.success;


            }

            public bool Enable(int txpin, int rxpin) {

                var cmd = string.Format("iren({0}, {1})", txpin, rxpin);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;
            }

        }
    }
}
