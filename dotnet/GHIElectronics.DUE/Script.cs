using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static GHIElectronics.DUE.DUEController;
using static GHIElectronics.DUE.SerialInterface;

namespace GHIElectronics.DUE {
    public partial class DUEController {
        public class ScriptController {

            SerialInterface serialPort;

            public ScriptController(SerialInterface serialPort) => this.serialPort = serialPort;

            public void Run() {
                var cmd = string.Format("run");

                this.serialPort.WriteCommand(cmd);

                // ensure the device enter to run mode.
                Thread.Sleep(1);

            }

            public bool New() {
                var cmd = string.Format("new");

                this.serialPort.WriteCommand(cmd);

                var respone = this.serialPort.ReadRespone();

                return respone.success;
            }

            public bool Load(string script) {
                var cmd = "pgmstream()";

                var raw = UTF8Encoding.UTF8.GetBytes(script);

                var data = new byte[raw.Length + 1];

                Array.Copy(raw, data, raw.Length);

                data[raw.Length] = 0;// stop the stream

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                if (!res.success) {
                    return false;
                }

                this.serialPort.WriteRawData(data, 0, data.Length);

                res = this.serialPort.ReadRespone();
                return res.success;
            }

            [Obsolete("The Load2 method is for testing purpose only.", false)]
            private bool Load2(string script) {
                var ret = true;
                var cmd = string.Format("$");

                CmdRespone respone;

                this.serialPort.WriteCommand(cmd);

                Thread.Sleep(1);

                script = script.Replace("\r", string.Empty);


                var startIdx = 0;

                for (var i = 0; i < script.Length; i++) {
                    var subscript = string.Empty;

                    if (script[i] == '\n') {
                        subscript = script.Substring(startIdx, i - startIdx);

                        startIdx = i + 1;
                    }
                    else if (i == script.Length - 1) {

                        subscript = script.Substring(startIdx, i - startIdx + 1);
                    }

                    this.serialPort.WriteCommand(subscript);

                    // need to wait for new response before send another scripts
                    respone = this.serialPort.ReadRespone();

                    if (respone.success == false) {
                        ret = false;
                        break;
                    }
                }

                cmd = string.Format(">");

                this.serialPort.WriteCommand(cmd);

                respone = this.serialPort.ReadRespone();

                return ret && respone.success;

            }

            public string Read() {
                var cmd = string.Format("list");

                this.serialPort.WriteCommand(cmd);

                var respone = this.serialPort.ReadRespone2();


                return respone.respone;

            }

            public bool Execute(string script) {
                var cmd = script;

                this.serialPort.WriteCommand(cmd);

                var respone = this.serialPort.ReadRespone();

                return respone.success;
            }

            public bool IsRunning() {
                this.serialPort.DiscardInBuffer();

               
                this.serialPort.WriteRawData(new byte[] { 0xFF }, 0, 1);

                Thread.Sleep(1);

                var data = new byte[1];

                try {
                    this.serialPort.ReadRawData(data, 0, data.Length);
                }
                catch {
                    // if running, should received 0xff
                    // it not, need to send '\n' to clear 0xff that was sent.
                    this.serialPort.WriteRawData(new byte[] { (byte)'\n' }, 0, 1);

                    this.serialPort.ReadRespone();
                }

                

                return data[0] == 0xFF;

            }

        }
    }
}
