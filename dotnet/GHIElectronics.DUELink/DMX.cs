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

            public bool DmxW(byte[] channel_data) {

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

                var ret = this.serialPort.ReadResponse();

                return ret.success;




            }

            public int DmxR(int channel) {


                var cmd = string.Format("DmxR({0})", channel);

                this.serialPort.WriteCommand(cmd);

                var ret = this.serialPort.ReadResponse();

                if (ret.success) {
                    try {
                        var value = int.Parse(ret.response);

                        return value;
                    }
                    catch {

                    }
                }
                return 0;
            }

            public int DmxRdy() {
                this.serialPort.WriteCommand("DmxRdy()");

                var ret = this.serialPort.ReadResponse();

                if (ret.success) {
                    try {
                        var value = int.Parse(ret.response);

                        return value;
                    }
                    catch {

                    }
                }
                return 0;
            }

            public bool DmxU() {
                this.serialPort.WriteCommand("DmxU()");

                this.serialPort.ReadResponse();

                var ret = this.serialPort.ReadResponse();

                return ret.success;
            }
        }
    }
}
