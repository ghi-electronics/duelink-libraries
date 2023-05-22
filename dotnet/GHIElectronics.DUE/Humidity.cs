using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUE {
    public partial class DUEController {
        public class HumidityController {
            SerialInterface serialPort;

            public HumidityController(SerialInterface serialPort) => this.serialPort = serialPort;

            public double Read(int pin, int sensortype) {
                if (pin < 0 || pin >= this.serialPort.DeviceConfig.MaxPinIO)
                    throw new ArgumentOutOfRangeException("Invalid pin.");


                var cmd = string.Format("print(humidity({0}, {1}))", pin.ToString(), sensortype.ToString());

                this.serialPort.WriteCommand(cmd);

                var respone = this.serialPort.ReadRespone();

                if (respone.success) {
                    try {
                        var value = int.Parse(respone.respone);

                        return value;
                    }
                    catch { }


                }

                return -1;

            }
        }
    }
}
