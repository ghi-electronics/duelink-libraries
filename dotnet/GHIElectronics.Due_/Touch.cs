using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUE {
    public partial class DUEController {


        public class TouchController {

            SerialInterface serialPort;

            public TouchController(SerialInterface serialPort) => this.serialPort = serialPort;

            public bool Read(int pin) {
                var cmd = string.Format("print(touchread({0}))", pin);
                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();
                var val = false;
                if (res.success) {


                    try {
                        val = int.Parse(res.respone) == 1 ? true : false;
                    }
                    catch { }
                }

                return val;

            }

           
            
        }
    }
}
