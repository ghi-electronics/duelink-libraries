using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class SoundController {
            SerialInterface serialPort;

            public SoundController(SerialInterface serialPort) => this.serialPort = serialPort;

            public bool Beep(int pin, uint frequency, uint durationms) {
                if (durationms > 1000) {
                    throw new Exception("Max duration is 1000 (one second)");
                }

                if (frequency > 10000) {
                    throw new Exception("Frequency is within range[0,10000] Hz");
                }

                if (pin < 0 || (pin >= this.serialPort.DeviceConfig.MaxPinIO && pin != (int)PinController.PIEZO))
                    throw new Exception("Invalid pin.");

                var cmd = string.Format("beep({0},{1},{2})", pin, frequency, durationms);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;


            }

            public bool Beep(char pin, uint frequency, uint durationms) {
                if (pin == 'p' || pin == 'P') {
                    return this.Beep((int)PinController.PIEZO, frequency, durationms);
                }

                return false;
            }
        }
    }
}
