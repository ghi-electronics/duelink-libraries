using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class FSController {
            SerialInterface serialPort = null;

            public FSController(SerialInterface port) => this.serialPort = port;

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

            int ParseReturn() {
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
            public int FsMnt(int type, int cs, int baud, int max_handle) {

                var cmd = string.Format("FsMnt({0},{1}, {2}, {3})", type, cs, baud, max_handle);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int FsUnMnt() {
                this.serialPort.WriteCommand("FsUnMnt()");

                return this.ParseReturn();
            }

            public int FsFmt(int type, int cs, int baud) {

                var cmd = string.Format("FsFmt({0},{1}, {2})", type, cs, baud);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int FsOpen(string path, int mode) {

                var cmd = string.Format("FsOpen(\"{0}\",{1})", path, mode);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int FsClose(int handle) {

                var cmd = string.Format("FsClose({0})", handle);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int FsWrite(int handle, byte[] data) {

                var write_array = string.Empty;

                write_array = "[";

                for (var i = 0; i < data.Length; i++) {
                    write_array += data[i];

                    if (i < data.Length - 1)
                        write_array += ",";
                }

                write_array += "]";

                var cmd = string.Format("FsWrite({0}, {1})", handle, write_array);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public byte[] FsRead(int handle, int count) {
                var data = new byte[count];

                var cmd = string.Format("dim b1[{0}]", data.Length);

                this.serialPort.WriteCommand(cmd);

                this.serialPort.ReadResponse();

                cmd = string.Format("FsRead({0}, b1)", handle);

                this.serialPort.WriteCommand(cmd);

                this.serialPort.ReadResponse();

                // use stream to read b1
                cmd = string.Format("strmrd(b1, {0})", data.Length);
                this.serialPort.WriteCommand(cmd);

                this.serialPort.ReadResponse();

                this.serialPort.ReadRawData(data, 0, data.Length);

                return data;
            }

            public int FsSync(int handle) {

                var cmd = string.Format("FsSync({0})", handle);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int FsSeek(int handle, int offset) {

                var cmd = string.Format("FsSeek({0},{1})", handle, offset);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int FsTell(int handle) {

                var cmd = string.Format("FsTell({0})", handle);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int FsDel(string path) {

                var cmd = string.Format("FsDel(\"{0}\")", path);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int FsFind(string path) {

                var cmd = string.Format("FsFind(\"{0}\")", path);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int Fsfsz(string path) {

                var cmd = string.Format("fsfsz(\"{0}\")", path);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

        }
    }
}
