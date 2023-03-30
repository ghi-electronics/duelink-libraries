using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static GHIElectronics.DUE.DUEController;

namespace GHIElectronics.DUE {
    public partial class DUEController {
        public class FrequencyController {

            SerialInterface serialPort;

            public FrequencyController(SerialInterface serialPort) => this.serialPort = serialPort;

            public int MaxFrequency { get; } = 1000000;
            public int MinFrequency { get; } = 16;

            public bool Write(int frequency, long duration_ms = 0, int dutycyle = 500 ) {
                if (frequency < this.MinFrequency || frequency > this.MaxFrequency) {
                    throw new Exception("Frequency must be in range 16Hz..1000000Hz");
                }

                if (duration_ms > 99999999) {
                    throw new Exception("duration_ms must be in range 0..99999999");
                }

                if (dutycyle < 0 || dutycyle > 1000) {
                    throw new Exception("dutycyle must be in range 0..1000");
                }


                //var cmd = "F " + frequency.ToString() + (duration_ms > 0 ? " " + duration_ms.ToString() : "");
                var cmd = string.Format("freq({0},{1},{2})", frequency.ToString(), duration_ms.ToString(), dutycyle.ToString());


                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;

            }

        }
    }
}
