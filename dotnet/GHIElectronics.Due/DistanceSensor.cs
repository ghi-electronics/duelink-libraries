using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static GHIElectronics.Due.DueController;

namespace GHIElectronics.Due {
    public partial class DueController {
        public class DistanceSensorController {


            SerialInterface serialPort;
            public DistanceSensorController(SerialInterface serialPort) => this.serialPort = serialPort;

            public int Read(int pulsePin, int echoPin) {
                if (pulsePin < 0 || pulsePin >= MAX_IO)
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                if (echoPin < 0 || echoPin >= MAX_IO)
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                var cmd = string.Format("print(distance({0},{1}))", pulsePin, echoPin);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                if (res.success) {
                    try {
                        var distance = int.Parse(res.respone);
                        return distance;
                    }
                    catch {

                    }

                }

                return -1;
            }
        }
    }
}
