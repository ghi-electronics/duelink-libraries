using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static GHIElectronics.DUELink.DUELinkController;
using static GHIElectronics.DUELink.SerialInterface;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class EngineController {

            SerialInterface serialPort;

            public EngineController(SerialInterface serialPort) => this.serialPort = serialPort;

            // run("version()/list") return version string, so need to return a string
            public string Run(string script) {
                var cmd = Encoding.UTF8.GetBytes(script + "\n");

                this.serialPort.DiscardInBuffer();
                this.serialPort.DiscardOutBuffer();


                this.serialPort.WriteRawData(cmd, 0, cmd.Length);

                var response = this.serialPort.ReadResponse();

                
                return response.response.ToString();                            

            }

            public bool Stop() {
                this.serialPort.DiscardInBuffer();
                this.serialPort.DiscardOutBuffer();

                this.serialPort.WriteRawData(new byte[] {27}, 0, 1);

                var response = this.serialPort.ReadResponse();


                return response.success;

            }

            public bool Select(int num) {
                var cmd = $"sel({num})";

                this.serialPort.WriteCommand(cmd);

                var response = this.serialPort.ReadResponse();

                return response.success;

            }

            public bool Record(string script) {

                var cmd = string.Format("new");

                this.serialPort.WriteCommand(cmd);

                var response = this.serialPort.ReadResponse();

                if (!response.success)
                    throw new Exception("Unable to erase the chip memory.");


                cmd = "pgmbrst()";

                var raw = UTF8Encoding.UTF8.GetBytes(script);

                var data = new byte[raw.Length + 1];

                Array.Copy(raw, data, raw.Length);

                data[raw.Length] = 0;// stop the stream

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                if (!res.success) {
                    return false;
                }

                this.serialPort.WriteRawData(data, 0, data.Length);

                res = this.serialPort.ReadResponse();
       
                return res.success;
            }            
            public string Read() {
                var cmd = string.Format("list");

                this.serialPort.WriteCommand(cmd);

                var response = this.serialPort.ReadResponse2();


                return response.response;

            }

            //public string Execute(string script) {
            //    var cmd = script;

            //    this.serialPort.WriteCommand(cmd);

            //    var response = this.serialPort.ReadResponse();

            //    return response.response;
            //}

            //public bool IsRunning() {
            //    this.serialPort.DiscardInBuffer();


            //    this.serialPort.WriteRawData(new byte[] { 0xFF }, 0, 1);

            //    Thread.Sleep(1);

            //    var data = new byte[1];

            //    try {
            //        this.serialPort.ReadRawData(data, 0, data.Length);
            //    }
            //    catch {
            //        // if running, should received 0xff
            //        // it not, need to send '\n' to clear 0xff that was sent.
            //        this.serialPort.WriteRawData(new byte[] { (byte)'\n' }, 0, 1);

            //        this.serialPort.ReadRespone();
            //    }



            //    return data[0] == 0xFF;

            //}

        }
    }
}
