using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class PulseController {
            SerialInterface serialPort;

            public PulseController(SerialInterface serialPort) => this.serialPort = serialPort;

            public int PulseIn(int pin, int state, TimeSpan timeout) {
                if (pin < 0 || pin >= this.serialPort.DeviceConfig.MaxPinIO)
                    throw new ArgumentOutOfRangeException("Invalid pin.");

;               var cmd = string.Format("PulseIn({0},{1},{2})", pin, state, timeout.TotalMinutes.ToString());

                this.serialPort.WriteCommand(cmd);

                var response = this.serialPort.ReadResponse();

                if (response.success) {
                    try {
                        var value = int.Parse(response.response);

                        return value;
                    }
                    catch {

                    }
                }
                return 0;
            }
        }
    }
}
