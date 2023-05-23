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
            public bool Enable(int pin, bool enable) {
                if (pin < 0)
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                if (pin > 2 ) {
                    if (pin != 97 && pin != 98 && pin != 65 && pin != 66)
                        throw new ArgumentOutOfRangeException("Invalid pin.");
                }
                    

                var cmd = string.Format("btnenable({0},{1})", pin, enable==true? 1:0);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;

            }

            public bool Enable(char pin, bool enable) => this.Enable((int)pin, enable);


            public bool WasPressed(int pin) {
                if (pin < 0)
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                if (pin > 2) {
                    if (pin != 97 && pin != 98 && pin != 65 && pin != 66)
                        throw new ArgumentOutOfRangeException("Invalid pin.");
                }

                var cmd = string.Format("print(btndown({0}))", pin);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                if (res.success) {
                    try {
                        var ready = int.Parse(res.respone);
                        return ready == 1 ? true : false ;
                    }
                    catch {
                       
                    }

                }

                return false;
            }

            public bool WasPressed(char pin) => this.WasPressed((int)pin);

            public bool IsReleased(int pin) {
                if (pin < 0)
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                if (pin > 2) {
                    if (pin != 97 && pin != 98 && pin != 65 && pin != 66)
                        throw new ArgumentOutOfRangeException("Invalid pin.");
                }

                var cmd = string.Format("print(btnup({0}))", pin);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                if (res.success) {
                    try {
                        var ready = int.Parse(res.respone);
                        return ready == 1 ? true : false;
                    }
                    catch {

                    }

                }

                return false;


            }

            public bool IsReleased(char pin) => this.IsReleased((int)pin);

        }
    }
}
