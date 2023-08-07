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

            private bool IsButtonValid(int pin) {
                if (pin != 0 && pin != 1 && pin != 2 &&  pin != 13 && pin != 14 && pin != 15 && pin != 16 && pin != 65 && pin != 66 && pin != 68 && pin != 76 && pin != 82 && pin != 85) {
                    return false;
                }

                return true;
            }
            public bool Enable(int pin, bool enable) {
                pin &= 0xdf;
                if (IsButtonValid(pin) == false) {
                    throw new ArgumentException("Invalid pin", nameof(pin));
                }


                var cmd = string.Format("btnenable({0},{1})", pin, enable==true? 1:0);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;

            }

            public bool Enable(char pin, bool enable) => this.Enable((int)pin, enable);


            public bool WasPressed(int pin) {
                pin &= 0xdf;
                if (IsButtonValid(pin) == false) {
                    throw new ArgumentException("Invalid pin", nameof(pin));
                }

                var cmd = string.Format("log(btndown({0}))", pin);

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

            public bool JustPressed(char pin) => this.WasPressed((int)pin);

            public bool IsReleased(int pin) {
                pin &= 0xdf;
                if (IsButtonValid(pin) == false) {
                    throw new ArgumentException("Invalid pin", nameof(pin));
                }

                var cmd = string.Format("log(btnup({0}))", pin);

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

            public bool JustReleased(char pin) => this.IsReleased((int)pin);

        }
    }
}
