using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class OtpController {
            SerialInterface serialPort;

            public OtpController(SerialInterface serialPort) => this.serialPort = serialPort;

            public bool OtpW(int address, byte[] data) {

                var write_array = string.Empty;

                write_array = "[";

                for (var i = 0; i < data.Length; i++) {
                    write_array += data[i];

                    if (i < data.Length - 1)
                        write_array += ",";
                }

                write_array += "]";

                var cmd = string.Format("OtpR({0})", write_array);

                this.serialPort.WriteCommand(cmd);

                var ret = this.serialPort.ReadResponse();

                return ret.success;
                               
            }

            public int OtpR(int address) {

                var cmd = string.Format("OtpR({0})", address);

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
