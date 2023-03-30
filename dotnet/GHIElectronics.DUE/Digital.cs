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
            PULL_NONE = 0,
            PULL_UP = 1,
            PULL_DOWN = 2,
        }
        public class DigitalController {

           

            SerialInterface serialPort;

            public DigitalController(SerialInterface serialPort) => this.serialPort = serialPort;

          

            public bool Read(int pin, Input input = Input.PULL_NONE) {
                if (pin < 0 || pin >= MAX_IO)
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                var pull = "0";

                if (input == Input.PULL_UP) pull = "1";
                if (input == Input.PULL_DOWN) pull = "2";

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
                if (pin < 0 || pin >= MAX_IO)
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
