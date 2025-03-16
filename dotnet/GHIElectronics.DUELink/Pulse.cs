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

            public bool Set(int pin, int pulseCount, int pulseDuration) {
                if (pin < 0 || pin >= this.serialPort.DeviceConfig.MaxPinIO)
                    throw new ArgumentOutOfRangeException("Invalid pin.");


                //var delay_us = (int)delay.TotalMicroseconds;

;               var cmd = string.Format("pulse({0},{1},{2})", pin.ToString(), pulseCount.ToString(), pulseDuration.ToString());

                this.serialPort.WriteCommand(cmd);

                var response = this.serialPort.ReadRespone();

                return response.success;
            }
        }
    }
}
