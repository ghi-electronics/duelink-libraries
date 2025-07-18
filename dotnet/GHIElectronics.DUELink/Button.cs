using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static GHIElectronics.DUELink.DUELinkController;

namespace GHIElectronics.DUELink {

    public partial class DUELinkController {
      
        public class ButtonController {


            SerialInterface serialPort;
            public ButtonController(SerialInterface serialPort) => this.serialPort = serialPort;


            public bool Enable(int pin, bool enable, int pull) {
  
                var cmd = string.Format("btnen({0},{1},{2})", pin, enable==true? 1:0, pull);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;

            }

            public bool Down(int pin) {
        

                var cmd = string.Format("btndown({0})", pin);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                if (res.success) {
                    try {
                        var ready = int.Parse(res.response);
                        return ready == 1 ? true : false ;
                    }
                    catch {
                       
                    }

                }

                return false;
            }

            public bool Up(int pin) {

                var cmd = string.Format("btnup({0})", pin);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                if (res.success) {
                    try {
                        var ready = int.Parse(res.response);
                        return ready == 1 ? true : false;
                    }
                    catch {

                    }
                }

                return false;
            }
        }
    }
}
