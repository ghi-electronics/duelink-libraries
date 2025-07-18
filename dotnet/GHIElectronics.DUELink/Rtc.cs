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

            public RtcController(SerialInterface port) => this.serialPort = port;

            public void RtcW(byte[] timedate) {

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

                this.serialPort.ReadResponse();
                               
            }

            public byte[] RtcR() {

                // we can't check response as Asio(1) there will be no response                
                var timedate = new byte[6];

                this.serialPort.WriteCommand("dim b1[6]");

                this.serialPort.ReadResponse();                

                this.serialPort.WriteCommand("OtpR(b1)");

                this.serialPort.ReadResponse();

                // use stream to read b1
                this.serialPort.WriteCommand("strmrd(b1, 6)");

                this.serialPort.ReadResponse();

                this.serialPort.ReadRawData(timedate, 0, timedate.Length);

                return timedate;
            }

            void Show() {
                this.serialPort.WriteCommand("OtpR(0)");

                this.serialPort.ReadResponse();
            }
            
        }
    }
}
