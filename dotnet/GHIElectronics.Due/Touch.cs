using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.Due {
    public partial class DueController {


        public class TouchController {

            SerialInterface serialPort;

            public TouchController(SerialInterface serialPort) => this.serialPort = serialPort;

            public bool Read(int pin) {
                var cmd = string.Format("print(touchread({0}))", pin);
                this.serialPort.WriteLine(cmd);

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
