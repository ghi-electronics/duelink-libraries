using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {


        public class TouchController {

            SerialInterface serialPort;

            public TouchController(SerialInterface serialPort) => this.serialPort = serialPort;

            public bool Touch(int pin, int charge_t, int charge_s, int timeout) {
                var cmd = $"touch({pin}, {charge_t}, {charge_s}, {timeout})";
                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();
                var val = false;
                if (res.success) {


                    try {
                        val = int.Parse(res.response) == 1 ? true : false;
                    }
                    catch { }
                }

                return val;

            }

           
            
        }
    }
}
