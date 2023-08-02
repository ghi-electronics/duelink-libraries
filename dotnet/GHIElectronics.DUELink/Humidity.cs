using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class HumidityController {
            SerialInterface serialPort;

            public HumidityController(SerialInterface serialPort) => this.serialPort = serialPort;

            public double Read(int pin, int sensortype) {
                if (pin < 0 || pin >= this.serialPort.DeviceConfig.MaxPinIO)
                    throw new ArgumentOutOfRangeException("Invalid pin.");


                var cmd = string.Format("log(humidity({0}, {1}))", pin.ToString(), sensortype.ToString());

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

            public int Dht11 { get; } = 11;
            public int Dht12 { get; } = 12;
            public int Dht21 { get; } = 21;
            public int Dht22 { get; } = 22;
        }
    }
}
