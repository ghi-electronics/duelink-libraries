using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public enum HumiditySensorType : uint {
            DHT11 = 1,
            DHT12 = 2,
            DHT21 = 3,
            DHT22 = 4,

        }
        public class HumidityController {
            SerialInterface serialPort;

            public HumidityController(SerialInterface serialPort) => this.serialPort = serialPort;

            public double Read(int pin, HumiditySensorType type) {
                if (pin < 0 || pin >= this.serialPort.DeviceConfig.MaxPinIO)
                    throw new ArgumentOutOfRangeException("Invalid pin.");


                var cmd = string.Format("humid({0}, {1})", pin.ToString(), ((int)(type)).ToString());

                this.serialPort.WriteCommand(cmd);

                var response = this.serialPort.ReadResponse();

                if (response.success) {
                    try {
                        var value = float.Parse(response.response);

                        return value;
                    }
                    catch { }


                }

                return -1;

            }
        }
    }
}
