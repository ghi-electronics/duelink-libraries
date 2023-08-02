using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static GHIElectronics.DUELink.DUELinkController;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class DistanceSensorController {


            SerialInterface serialPort;
            public DistanceSensorController(SerialInterface serialPort) => this.serialPort = serialPort;

            public float Read(int pulsePin, int echoPin) {
                if (pulsePin < 0 || pulsePin >= this.serialPort.DeviceConfig.MaxPinIO)
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                if (echoPin >= this.serialPort.DeviceConfig.MaxPinIO)
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                var cmd = string.Format("log(distance({0},{1}))", pulsePin, echoPin);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                if (res.success) {
                    try {
                        var distance = float.Parse(res.respone);
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
