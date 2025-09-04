using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class DownlinkController {
            SerialInterface serialPort;
            public DownlinkController(SerialInterface serialPort) {
                this.serialPort = serialPort; ;
            }

            public bool SetMode(int mode) {
                this.serialPort.WriteCommand($"dlmode({mode})");

                var response = this.serialPort.ReadResponse();

                if (response.success) {
                    try {
                        var value = int.Parse(response.response);

                        return value != 0;
                    }
                    catch {

                    }
                }

                return false;

            }
            public float Command(string s) {
                this.serialPort.WriteCommand($"cmd({s})");

                var response = this.serialPort.ReadResponse();

                if (response.success) {
                    try {
                        var value = float.Parse(response.response);

                        return value;
                    }
                    catch {

                    }
                }

                return 0;
            }

            public bool SetTimeout(TimeSpan timeout) {
                this.serialPort.WriteCommand($"cmdtmot({timeout.TotalMilliseconds})");

                var response = this.serialPort.ReadResponse();

                return response.success;
            }


        }
    }
}
