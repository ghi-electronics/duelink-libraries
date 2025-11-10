using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class PulseController {
            SerialInterface serialPort;

            public PulseController(SerialInterface serialPort) => this.serialPort = serialPort;

            public int Read(int pin, int charge_t, int charge_s, int timeout) { 
                var cmd = $"PulseIn({pin}, {charge_t}, {charge_s}, {timeout})";

                this.serialPort.WriteCommand(cmd);

                var response = this.serialPort.ReadResponse();

                if (response.success) {
                    try {
                        var value = int.Parse(response.response);

                        return value;
                    }
                    catch {

                    }
                }
                return 0;
            }
        }
    }
}
