using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static GHIElectronics.DUELink.DUELinkController;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class FrequencyController {

            SerialInterface serialPort;

            public FrequencyController(SerialInterface serialPort) => this.serialPort = serialPort;

            public int MaxFrequency { get; } = 10000000;
            public int MinFrequency { get; } = 16;


            public bool Write(int pin, int frequency, long duration_ms = 0, double dc = 0.5 ) {
                if (frequency < this.MinFrequency || frequency > this.MaxFrequency) {
                    throw new Exception("Frequency must be in range 15Hz..10000000Hz");
                } 

                if (dc < 0 || dc > 1.0) {
                    throw new Exception("dutycyle must be in range 0.0..1.0");
                }

                if (Array.IndexOf(this.serialPort.DeviceConfig.PWMPins, pin) == -1) {
                    throw new Exception("Invalid pin used for frequency");
                }


                var cmd = string.Format("freq({0},{1},{2}, {3})", pin.ToString(), frequency.ToString(), duration_ms.ToString(), dc.ToString());

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;

            }

        }
    }
}
