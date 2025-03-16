using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        
        public class ServoController {

            SerialInterface serialPort;

            public ServoController(SerialInterface serialPort) => this.serialPort = serialPort;

            public bool Set(int pin, int position) {
                if (pin < 0 || Array.IndexOf(this.serialPort.DeviceConfig.PWMPins, pin) == -1)
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                if (position < 0 || position > 180) {
                    throw new Exception("position must be in 0..180");
                }

                var cmd = string.Format("servost({0},{1})", pin.ToString(), position.ToString());

                this.serialPort.WriteCommand(cmd);

                var response = this.serialPort.ReadResponse();

                return response.success;
            }

        }

    }
}
