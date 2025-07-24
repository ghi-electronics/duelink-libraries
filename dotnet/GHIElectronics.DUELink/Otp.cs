using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class OtpController {
            SerialInterface serialPort;
            StreamController stream;
            public OtpController(SerialInterface serialPort, StreamController stream) {
                this.serialPort = serialPort;
                this.stream = stream;
            }

            public bool OtpW(int address, byte[] data) {

                //var write_array = string.Empty;

                //write_array = "[";

                //for (var i = 0; i < data.Length; i++) {
                //    write_array += data[i];

                //    if (i < data.Length - 1)
                //        write_array += ",";
                //}

                //write_array += "]";

                //var cmd = string.Format("OtpW({0},{1})", address,write_array);

                var cmd = $"dim b9[{data.Length}]";
                this.serialPort.WriteCommand(cmd);
                this.serialPort.ReadResponse();

                var written = this.stream.WriteBytes("b9", data);

                cmd = $"OtpW({address},b9)";
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
