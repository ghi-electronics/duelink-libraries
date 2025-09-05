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

            public bool Write(byte[] rtc_timedate) {

                //var write_array = string.Empty;

                //write_array = "[";

                //for (var i = 0; i < timedate.Length; i++) {
                //    write_array += timedate[i];

                //    if (i < timedate.Length - 1)
                //        write_array += ",";
                //}

                //write_array += "]";

                //var cmd = string.Format("RtcW({0})", write_array);

                var cmd = $"dim b9[{rtc_timedate.Length}]";
                this.serialPort.WriteCommand(cmd);
                this.serialPort.ReadResponse();

                var written = this.stream.WriteBytes("b9", rtc_timedate);

                cmd = "RtcW(b9)";
                this.serialPort.WriteCommand(cmd);

                var ret = this.serialPort.ReadResponse();

                return ret.success;                
                               
            }

            public int Read(byte[] rtc_timedate) {
                var cmd = $"dim b9[{rtc_timedate.Length}]";
                this.serialPort.WriteCommand(cmd);
                this.serialPort.ReadResponse();

                // we can't check response as Asio(1) there will be no response                                              
                this.serialPort.WriteCommand("RtcR(b9)");

                this.serialPort.ReadResponse();

                // use stream to read b9
                var ret = this.stream.ReadBytes("b9", rtc_timedate);

                return ret;
            }

            //public string ReadFmt() {
            //    this.serialPort.WriteCommand("RtcR(0)");

            //    var ret = this.serialPort.ReadResponse();

            //    return ret.response;

            //}
            
        }
    }
}
