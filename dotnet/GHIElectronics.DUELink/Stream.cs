using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class StreamController {
            SerialInterface serialPort;

            public StreamController(SerialInterface serialPort) => this.serialPort = serialPort;

            public bool Spi(byte[] data) {

                var cmd = string.Format("strmspi({0})", data.Length);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                if (res.success) {
                    this.serialPort.WriteRawData(data, 0, data.Length);
                }

                return res.success;
            }
            public bool WriteBytes(string array, byte[] data, int count) {

                var cmd = string.Format("strmwr({0}, {1})", array, count);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                if (res.success) {
                    this.serialPort.WriteRawData(data, 0, data.Length);
                }

                return res.success;
            }

            public bool WriteFloats(string array, float[] data, int count) {

                var cmd = string.Format("strmwr({0}, {1})", array, count);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                if (res.success) {
                    for (var i = 0; i < count; i++) {
                        var b = BitConverter.GetBytes(data[i]);
                        this.serialPort.WriteRawData(b, 0, b.Length);
                    }

                   
                }

                return res.success;
            }

            public bool ReadBytes(string array, byte[] data, int count) {

                var cmd = string.Format("strmrd({0}, {1})", array, count);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                if (res.success) {
                    this.serialPort.ReadRawData(data, 0, data.Length);
                }

                return true;
            }
            public bool ReadFloats(string array, float[] data, int count) {
                var data_bytes = new byte[count * 4];

                var cmd = string.Format("strmrd({0}, {1})", array, count);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                if (res.success) {
                    this.serialPort.ReadRawData(data_bytes, 0, data_bytes.Length);
                }

                for (var i = 0; i < data_bytes.Length; i += 4) {
                    data[i/4] = BitConverter.ToSingle(data_bytes, i);
                }

                return true;
            }
        }
    }
}
