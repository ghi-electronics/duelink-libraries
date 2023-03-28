using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.Due {

    public partial class DueController {
        public enum Configuration {
            Hid = 1,
            TouchEdge = 2,
            Arrow = 4
        }
        public class ConfigurationController {

            SerialInterface serialPort;

            public ConfigurationController(SerialInterface serialPort) => this.serialPort = serialPort;

            public bool Set(Configuration configuration, bool enable) {

                var cmd = "Q";

                cmd += " " + (configuration == Configuration.Hid ? "H" : (configuration == Configuration.TouchEdge ? "E" : "A"));
                cmd += " " + (enable == true ? "E" : "D");

                this.serialPort.WriteLine(cmd);

                var res = this.serialPort.ReadRespone();

                if (res.success) {
                    return true;
                }

                return false;
            }

            public string Read() {
                var cmd = "Q" + " " + "R";

                this.serialPort.WriteLine(cmd);


                var res = this.serialPort.ReadRespone();

                if (res.success) {
                    return res.respone;
                }

                return string.Empty;
            }

            public bool Flush() {
                var cmd = "Q" + " " + "F";


                this.serialPort.WriteLine(cmd);

                try {
                    this.serialPort.Disconnect();
                    Thread.Sleep(1000);// while for devive reset
                    this.serialPort.Connect();
                }
                catch {
                    return false;
                }


                return true;
            }

        }

    }
}
