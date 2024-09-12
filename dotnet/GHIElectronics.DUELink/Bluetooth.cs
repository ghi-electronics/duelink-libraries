using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class BluetoothController {
            SerialInterface serialPort;

            public BluetoothController(SerialInterface serialPort) => this.serialPort = serialPort;

            public bool SetName(string name) {
                var cmd = $"wname({name},{name.Length})";

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;

            }

            public bool SetSpeed(int speed) {
                if (speed != 115200 && speed != 9600)
                    throw new Exception("Support speed 9600 or 115200 only");

                var cmd = $"wspeed({speed.ToString()})";

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;

            }

            public bool SetPinCode(string pinCode) {
                try {
                    var p = int.Parse(pinCode);
                }
                catch {
                    throw new Exception("PinCode invalid.");
                }

                if (pinCode.Length != 4) {
                    throw new Exception("PinCode invalid.");
                }

                var cmd = $"wcode({pinCode})";

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;

            }
        }
    }
}
