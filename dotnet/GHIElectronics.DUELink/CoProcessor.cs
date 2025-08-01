using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class CoProcessorController {
            SerialInterface serialPort;
            StreamController stream;
            public CoProcessorController(SerialInterface serialPort, StreamController stream) {
                this.serialPort = serialPort;
                this.stream = stream;
            }


            public bool CoprocE() {

                // we can't check response as Asio(1) there will be no response                                

                this.serialPort.WriteCommand("CoprocE()");

                var ret = this.serialPort.ReadResponse();

                return ret.success;
            }

            public bool CoprocP() {

                // need Xmodem 1K, TODO
                // 
                throw new NotImplementedException(); ;
            }

            public bool CoprocS() {
                this.serialPort.WriteCommand("CoprocS()");

                var ret = this.serialPort.ReadResponse();

                return ret.success;
            }

            public string CoprocV() {
                this.serialPort.WriteCommand("CoprocV()");

                var ret = this.serialPort.ReadResponse();

                return ret.response;
            }

            public int CoprocW(byte[] data) {

                var write_array = string.Empty;

                write_array = "[";

                for (var i = 0; i < data.Length; i++) {
                    write_array += data[i];

                    if (i < data.Length - 1)
                        write_array += ",";
                }

                write_array += "]";

                var cmd = string.Format("CoprocW({0})", write_array);

                this.serialPort.WriteCommand(cmd);

                var ret = this.serialPort.ReadResponse();

                if (ret.success)
                    return write_array.Length;

                return 0;
            }

            public int CoprocR(byte[] data) {
                var count = data.Length;
                // we can't check response as Asio(1) there will be no response                
                var cmd = string.Format("dim b9[{0}])", count);

                this.serialPort.WriteCommand(cmd);

                this.serialPort.ReadResponse();

                this.serialPort.WriteCommand("CoprocR(b9)");

                var ret = this.serialPort.ReadResponse();

                // use stream to read b9
                var read = this.stream.ReadBytes("b9", data);

                if (ret.success)
                    return read;

                return 0;
            }

        }
    }
}
