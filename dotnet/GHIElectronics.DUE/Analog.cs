using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUE {
    public partial class DUEController {

        public class AnalogController {

            SerialInterface serialPort;

            public AnalogController(SerialInterface serialPort) => this.serialPort = serialPort;

            public int Read(int pin) {
                if (pin < 0 || pin >= this.serialPort.DeviceConfig.MaxPinAnalog)
                    throw new ArgumentOutOfRangeException("Invalid pin.");


                var cmd = string.Format("print(aread({0}))", pin.ToString());

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

            public int FixedFrequency { get; } = 50;
            public bool Write(int pin, int dutycyle) {
                if (pin < 0 || (pin >= this.serialPort.DeviceConfig.MaxPinIO ))
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                if (dutycyle < 0 || dutycyle > 1000) {
                    throw new Exception("Dutycle must be in 0..1000");
                }

                var cmd = string.Format("awrite({0},{1})", pin.ToString(), dutycyle.ToString());


                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                if (res.success) {
                    return true;
                }

                return false;
            }
        }
    }
}
