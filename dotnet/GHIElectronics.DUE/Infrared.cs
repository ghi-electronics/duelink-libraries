using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUE {
    public partial class DUEController {
        public class InfraredController {

            SerialInterface serialPort;

            public InfraredController(SerialInterface serialPort) => this.serialPort = serialPort;

            public int Read() {
                var cmd = "print(irread())";
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

            public bool Enable(bool enable) {
                var cmd = string.Format("irenable({0})", enable == true?1:0);

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
