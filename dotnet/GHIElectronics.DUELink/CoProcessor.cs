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

            public CoProcessorController(SerialInterface port) => this.serialPort = port;

            

            public void CoprocE() {

                // we can't check response as Asio(1) there will be no response                                

                this.serialPort.WriteCommand("CoprocE()");

                this.serialPort.ReadResponse();                                
            }

            public void CoprocP() {

                // need Xmodem 1K, TODO
                // 
                throw new NotImplementedException(); ;
            }

            public void CoprocS() {
                this.serialPort.WriteCommand("CoprocS()");

                this.serialPort.ReadResponse();
            }

            public string CoprocV() {
                this.serialPort.WriteCommand("CoprocV()");

                var ret = this.serialPort.ReadResponse();

                return ret.response;
            }

            public void CoprocW(byte[] data) {

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

                this.serialPort.ReadResponse();

            }

            public byte[] CoprocR(int count) {
                var data = new byte[count];
                // we can't check response as Asio(1) there will be no response                
                var cmd = string.Format("dim b1[{0}])", count);

                this.serialPort.WriteCommand(cmd);

                this.serialPort.ReadResponse();

                this.serialPort.WriteCommand("CoprocR(b1)");

                this.serialPort.ReadResponse();

                // use stream to read b1
                cmd = string.Format("strmrd(b1, {0})", count);
                this.serialPort.WriteCommand(cmd);

                this.serialPort.ReadResponse();

                this.serialPort.ReadRawData(data, 0, data.Length);

                return data;
            }

        }
    }
}
