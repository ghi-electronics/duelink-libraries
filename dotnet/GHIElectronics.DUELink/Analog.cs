using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {

        public class AnalogController {

            SerialInterface serialPort;

            public AnalogController(SerialInterface serialPort) => this.serialPort = serialPort;

            public double VRead(int pin) {
                if (pin < 0 || pin >= this.serialPort.DeviceConfig.MaxPinAnalog)
                    throw new ArgumentOutOfRangeException("Invalid pin.");


                var cmd = string.Format("vread({0})", pin.ToString());

                this.serialPort.WriteCommand(cmd);

                var response = this.serialPort.ReadRespone();

                if (response.success) {                   
                    try {
                        var value = double.Parse(response.respone);

                        return value;
                    }
                    catch {

                    }


                }

                return 0;
            }

            public int FixedFrequency { get; } = 50;
            public bool PWrite(int pin, double dc) {
                if (pin < 0 || ((pin >= this.serialPort.DeviceConfig.MaxPinIO ) && pin != (int)PinController.LED)) 
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                if (dc < 0 || dc > 1) {
                    throw new Exception("Dutycle must be in 0..0.1");
                }

                var cmd = string.Format("pwrite({0},{1})", pin.ToString(), dc.ToString());


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
