using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.Due {
    public partial class DueController {
        
        public class ServoMotoController {

            SerialInterface serialPort;

            public ServoMotoController(SerialInterface serialPort) => this.serialPort = serialPort;

            public bool Set(int pin, int position) {
                if (pin < 0 || pin >= MAX_IO)
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                if (position < 0 || position > 180) {
                    throw new Exception("position must be in 0..100");
                }

                var cmd = string.Format("servoset({0},{1})", pin.ToString(), position.ToString());

                this.serialPort.WriteLine(cmd);

                var respone = this.serialPort.ReadRespone();

                return respone.success;
            }

        }

    }
}
