using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {

        public class UartController {

            SerialInterface serialPort;
            StreamController stream;

            public UartController(SerialInterface serialPort, StreamController stream) {
                this.serialPort = serialPort;
                this.stream = stream;
            }


            public bool Configuration(int baurdate, int rx_buffer_size) {

                var cmd = string.Format("SerCfg({0}, {1})", baurdate, rx_buffer_size);

                this.serialPort.WriteCommand(cmd);

                var ret = this.serialPort.ReadResponse();

                return ret.success;
            }

            public bool WriteByte(byte data) {
                var cmd = string.Format("SerWr({0})", data);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;
            }

            public int WriteBytes(byte[] data) {

                var cmd = $"dim b9[{data.Length}]";
                this.serialPort.WriteCommand(cmd);
                this.serialPort.ReadResponse();

                var written = this.stream.WriteBytes("b9", data);

                cmd = string.Format("SerWrs(b9)");
                this.serialPort.WriteCommand(cmd);
                var ret = this.serialPort.ReadResponse();

                if (ret.success)
                    return written;

                return 0;
            }

            
            public byte ReadByte() {                

                this.serialPort.WriteCommand("SerRd()");

                var res = this.serialPort.ReadResponse();

                if (res.success) {
                    try {
                        var data = (byte)int.Parse(res.response);
                        return data;
                    }
                    catch {
                        
                    }

                }

                return 0;
            }

            public int ReadBytes(byte[] data, TimeSpan timeout) {

                var cmd = $"dim b9[{data.Length}]";
                this.serialPort.WriteCommand(cmd);
                this.serialPort.ReadResponse();


                cmd = string.Format("SerRds(b9, {0})", timeout.TotalMilliseconds);
                this.serialPort.WriteCommand(cmd);
                this.serialPort.ReadResponse();

                var ret = this.stream.ReadBytes("b9", data);

                return ret;
            }

            public int BytesToRead() {
                this.serialPort.WriteCommand("SerB2R()");

                var res = this.serialPort.ReadResponse();

                if (res.success) {
                    try {
                        var ready = int.Parse(res.response);
                        return ready;
                    }
                    catch {

                    }

                }
                return 0;
            }

            public bool Discard() {
                this.serialPort.WriteCommand("SerDisc()");

                var res = this.serialPort.ReadResponse();

                return res.success;
            }



        }
    }
}
