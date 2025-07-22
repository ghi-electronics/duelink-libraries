using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class RtcController {
            SerialInterface serialPort = null;
            StreamController stream;

            public RtcController(SerialInterface serialPort, StreamController stream) {
                this.serialPort = serialPort;
                this.stream = stream;
            }

            public bool RtcW(byte[] timedate) {

                var write_array = string.Empty;

                write_array = "[";

                for (var i = 0; i < timedate.Length; i++) {
                    write_array += timedate[i];

                    if (i < timedate.Length - 1)
                        write_array += ",";
                }

                write_array += "]";

                var cmd = string.Format("RtcW({0})", write_array);

                this.serialPort.WriteCommand(cmd);

                var ret = this.serialPort.ReadResponse();

                return ret.success;
                               
            }

            public int RtcR(byte[] rtc_timedate) {

                // we can't check response as Asio(1) there will be no response                                
                this.serialPort.WriteCommand("dim b9[6]");

                this.serialPort.ReadResponse();                

                this.serialPort.WriteCommand("RtcR(b9)");

                this.serialPort.ReadResponse();

                // use stream to read b9
                var ret = this.stream.ReadBytes("b9", rtc_timedate);

                return ret;
            }

            public bool RtcShow() {
                this.serialPort.WriteCommand("OtpR(0)");

                var ret = this.serialPort.ReadResponse();

                return ret.success;

            }
            
        }
    }
}
