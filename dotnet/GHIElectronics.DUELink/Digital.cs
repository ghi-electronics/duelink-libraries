using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using static GHIElectronics.DUELink.DUELinkController.DigitalController;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        //public enum Input {
        //    PullNone = 0,
        //    PullUp = 1,
        //    PullDown = 2,
        //}
        public class DigitalController {

           

            SerialInterface serialPort;

            public DigitalController(SerialInterface serialPort) => this.serialPort = serialPort;

          

            public bool Read(int pin, int input = 0) {
                if (pin < 0 || (pin >= this.serialPort.DeviceConfig.MaxPinIO && pin != (int)PinController.BUTTON_A && pin != (int)PinController.BUTTON_B && pin != (int)PinController.BUTTON_U && pin != (int)PinController.BUTTON_D && pin != (int)PinController.BUTTON_L && pin != (int)PinController.BUTTON_R && pin != (int)PinController.LED))
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                var pull = "0";

                if (input == PinController.PULLUP) pull = "1";
                if (input == PinController.PULLDOWN) pull = "2";

                var cmd = string.Format("log(dread({0},{1}))", pin.ToString(), pull);



                this.serialPort.WriteCommand(cmd);

                var respone = this.serialPort.ReadRespone();

                if (respone.success) {

                    respone.respone = this.serialPort.RemoveEchoRespone(respone.respone, cmd);
                    try {
                        var value = int.Parse(respone.respone);

                        return value == 1;
                    }
                    catch { }

                    
                }

                return false;
            }

            public bool Read(char c, int input = 0) {
                int pin = -1;

                if (c == 'a' || c == 'A')
                    pin = PinController.BUTTON_A;

                if (c == 'b' || c == 'B')
                    pin = PinController.BUTTON_B;

                if (pin != -1) {
                    return this.Read(pin, input);   
                }

                return false;
            }

            public bool Write(int pin, bool value) {
                if (pin < 0 || (pin >= this.serialPort.DeviceConfig.MaxPinIO && pin != (int)PinController.LED))
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                var v = (value == true ? 1 : 0);

                var cmd = string.Format("dwrite({0},{1})", pin, (value == true ? 1 : 0));

                this.serialPort.WriteCommand(cmd);

                var respone = this.serialPort.ReadRespone();

                return respone.success;
            }

            public bool Write(char c, bool value) {
                if (c == 'l' || c == 'L')
                    return this.Write((int)PinController.LED, value);

                return false;
            }
        }

       
    }
}
