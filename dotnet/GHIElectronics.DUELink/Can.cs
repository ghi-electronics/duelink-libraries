using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class CanController {
            SerialInterface serialPort;

            public CanController(SerialInterface serialPort) => this.serialPort = serialPort;


            public bool Initialize(int baudrate) {
                var baudrate_string = string.Empty;

                switch (baudrate) {
                    case 100_000:
                    case 250_000:
                    case 500_000:
                    case 1000_000:
                        baudrate_string = baudrate.ToString();

                        break;

                }

                if (baudrate_string == string.Empty) {
                    throw new ArgumentException("baudrate must be 100_000, 250_000, 500_000, 1000_000");
                }

                var cmd = $"caninit({baudrate_string.ToString()})";

                this.serialPort.WriteCommand(cmd);

                var response = this.serialPort.ReadRespone();

                return response.success;
            }

            public bool InitializeExt(int phase1, int phase2, int prescaler, int synchronizationJumpWidth) {


                var cmd = $"caninitext({phase1}, {phase2}, {prescaler}, {synchronizationJumpWidth})";

                this.serialPort.WriteCommand(cmd);

                var response = this.serialPort.ReadRespone();

                return response.success;
            }

            public int Available() {
                var cmd = $"log(canavailable())";

                this.serialPort.WriteCommand(cmd);

                var response = this.serialPort.ReadRespone();

                if (response.success) {
                    try {
                        var value = int.Parse(response.respone);

                        return value;
                    }
                    catch { }


                }

                return -1;
            }

            public bool WriteMessage(CanMessage message) {

                var data = new byte[16];

                data[0] = (byte)((message.Id >> 24) & 0xFF);
                data[1] = (byte)((message.Id >> 16) & 0xFF);
                data[2] = (byte)((message.Id >> 8) & 0xFF);
                data[3] = (byte)((message.Id >> 0) & 0xFF);

                data[4] = message.Extended ? (byte)1 : (byte)0;
                data[5] = message.RemoteRequest ? (byte)1 : (byte)0;
                data[6] = message.Length;
                data[7] = 0; // reserved

                for (var i = 0; i < 8; i++) {
                    data[8 + i] = message.Data[i];
                }

                var cmd = "canwritestream()";

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone(); // Read '&' to check device ready before send

                if (!res.success) {

                    throw new Exception("CAN write error: " + res.respone);
                }

                this.serialPort.WriteRawData(data, 0, data.Length);

                res = this.serialPort.ReadRespone();

                return res.success;


            }

            public CanMessage ReadMessage() {

                var cmd = "canreadstream()";

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone(); // Read '&' to check device ready before send

                if (!res.success) {

                    throw new Exception("CAN read error: " + res.respone);
                }

                var data = new byte[16];

                this.serialPort.ReadRawData(data, 0, data.Length);

                var id = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];
                var message = new CanMessage((uint)id, data[4] > 0 ? true : false, data[5] > 0 ? true : false, data, 8, data[6]);


                res = this.serialPort.ReadRespone();

                if (res.success)

                    return message;
                else return null;

            }


        }

        public class CanMessage {
            public uint Id { get; set; }
            public bool Extended { get; set; }
            public bool RemoteRequest { get; set; }
            public byte Length { get; set; }
            public byte[] Data { get; set; }

            public CanMessage(uint id, bool extended, bool remoteRequest, byte[] data, int offset, int length) {
                if (length > 8)
                    throw new Exception($"Length {length} invalid");

                this.Data = new byte[8];
                this.Id = id;
                this.Extended = extended;
                this.RemoteRequest = remoteRequest;
                this.Length = (byte)length;

                Array.Copy(data, offset, this.Data, 0, length);

            }
        }
    }
}
