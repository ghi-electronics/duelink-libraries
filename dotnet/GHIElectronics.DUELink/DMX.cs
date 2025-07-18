using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class DMXController {
            SerialInterface serialPort;

            public DMXController(SerialInterface serialPort) => this.serialPort = serialPort;

            public void DmxW(byte[] channel_data) {

                var write_array = string.Empty;

                write_array = "[";

                for (var i = 0; i < channel_data.Length; i++) {
                    write_array += channel_data[i];

                    if (i < channel_data.Length - 1)
                        write_array += ",";
                }

                write_array += "]";

                var cmd = string.Format("DmxW({0})", write_array);

                this.serialPort.WriteCommand(cmd);

                this.serialPort.ReadResponse();
                               
            }

            public int DmxR(int channel) {


                var cmd = string.Format("DmxR({0})", channel);

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

            public int DmxRdy() {
                this.serialPort.WriteCommand("DmxRdy()");

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

            public void DmxU() {
                this.serialPort.WriteCommand("DmxU()");

                this.serialPort.ReadResponse();                
            }
        }
    }
}
