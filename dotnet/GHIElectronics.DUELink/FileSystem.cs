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
            StreamController stream;

            public FSController(SerialInterface port, StreamController stream) {
                this.serialPort = port;
                this.stream = stream;   
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
                return -1;
            }
            public int Mount(int type, int cs, int baud, int max_handle) {

                var cmd = string.Format("FsMnt({0},{1}, {2}, {3})", type, cs, baud, max_handle);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int UnMount() {
                this.serialPort.WriteCommand("FsUnMnt()");

                return this.ParseReturn();
            }

            public int Format(int type, int cs, int baud) {

                var cmd = string.Format("FsFmt({0},{1}, {2})", type, cs, baud);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int Open(string path, int mode) {

                var cmd = string.Format("FsOpen(\"{0}\",{1})", path, mode);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int Close(int handle) {

                var cmd = string.Format("FsClose({0})", handle);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int Write(int handle, byte[] data) {

                //var write_array = string.Empty;

                //write_array = "[";

                //for (var i = 0; i < data.Length; i++) {
                //    write_array += data[i];

                //    if (i < data.Length - 1)
                //        write_array += ",";
                //}

                //write_array += "]";

                //var cmd = string.Format("FsWrite({0}, {1})", handle, write_array);

                //this.serialPort.WriteCommand(cmd);

                //return this.ParseReturn();

                // declare b9 to write
                var cmd = $"dim b9[{data.Length}]";
                this.serialPort.WriteCommand(cmd);
                this.serialPort.ReadResponse();

                var ret = this.stream.WriteBytes("b9", data);

                cmd = string.Format("FsWrite({0}, b9)", handle);
                this.serialPort.WriteCommand(cmd);
                return this.ParseReturn();
            }

            public int Read(int handle, byte[] data) {
                var count = data.Length;                

                var cmd = string.Format("dim b9[{0}]", data.Length);
                this.serialPort.WriteCommand(cmd);
                this.serialPort.ReadResponse();

                cmd = string.Format("FsRead({0}, b9)", handle);
                this.serialPort.WriteCommand(cmd);
                this.serialPort.ReadResponse();

                // use stream to read b9
                var ret = this.stream.ReadBytes("b9", data);

                return ret;
            }

            public int Sync(int handle) {

                var cmd = string.Format("FsSync({0})", handle);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int Seek(int handle, int offset) {

                var cmd = string.Format("FsSeek({0},{1})", handle, offset);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int Tell(int handle) {

                var cmd = string.Format("FsTell({0})", handle);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int Delete(string path) {

                var cmd = string.Format("FsDel(\"{0}\")", path);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int Find(string path) {

                var cmd = string.Format("FsFind(\"{0}\")", path);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

            public int Size(string path) {

                var cmd = string.Format("fsfsz(\"{0}\")", path);

                this.serialPort.WriteCommand(cmd);

                return this.ParseReturn();
            }

        }
    }
}
