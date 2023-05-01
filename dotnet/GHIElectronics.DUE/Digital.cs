using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using static GHIElectronics.DUE.DUEController.DigitalController;

namespace GHIElectronics.DUE {
    public partial class DUEController {
        public enum Input {
            PullNone = 0,
            PullUp = 1,
            PullDown = 2,
        }
        public class DigitalController {

           

            SerialInterface serialPort;

            public DigitalController(SerialInterface serialPort) => this.serialPort = serialPort;

          

            public bool Read(int pin, Input input = Input.PullNone) {
                if (pin < 0 || (pin >= this.serialPort.DeviceConfig.MaxPinIO && pin != (int)DUEController.Pin.ButtonA && pin != (int)DUEController.Pin.ButtonB && pin != (int)DUEController.Pin.Led))
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                var pull = "0";

                if (input == Input.PullUp) pull = "1";
                if (input == Input.PullDown) pull = "2";

                var cmd = string.Format("print(dread({0},{1}))", pin.ToString(), pull);



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

            public bool Write(int pin, bool value) {
                if (pin < 0 || (pin >= this.serialPort.DeviceConfig.MaxPinIO && pin != (int)DUEController.Pin.Led))
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                var v = (value == true ? 1 : 0);

                var cmd = string.Format("dwrite({0},{1})", pin, (value == true ? 1 : 0));

                this.serialPort.WriteCommand(cmd);

                var respone = this.serialPort.ReadRespone();

                return respone.success;
            }
        }

       
    }
}
