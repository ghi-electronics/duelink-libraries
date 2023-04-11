using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static GHIElectronics.DUE.DUEController;

namespace GHIElectronics.DUE {
    public partial class DUEController {
        public class DistanceSensorController {


            SerialInterface serialPort;
            public DistanceSensorController(SerialInterface serialPort) => this.serialPort = serialPort;

            public int Read(int pulsePin, int echoPin) {
                if (pulsePin < 0 || pulsePin >= this.serialPort.DeviceConfig.MaxPinIO)
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                if (echoPin < 0 || echoPin >= this.serialPort.DeviceConfig.MaxPinIO)
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
