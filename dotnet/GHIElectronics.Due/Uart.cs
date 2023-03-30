using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUE {
    public partial class DUEController {

        public class UartController {

            SerialInterface serialPort;

            public UartController(SerialInterface serialPort) => this.serialPort = serialPort;

            public bool Enable(int baurdate) {

                var cmd = string.Format("uartinit({0})", baurdate);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;
            }

            public bool Write(byte data) {
                var cmd = string.Format("uartwrite({0})", data);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;
            }

            public int BytesToRead() {
                var cmd = string.Format("print(uartcount())");

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                if (res.success) {
                    try {
                        var ready = int.Parse(res.respone);
                        return ready;
                    }
                    catch {
                        goto error;
                    }

                }
error:
                throw new Exception("BytesToRead error!");
            }

            public byte Read() {
                var cmd = string.Format("print(uartread())");

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                if (res.success) {
                    try {
                        var data = (byte)int.Parse(res.respone);
                        return data;
                    }
                    catch {
                        goto error;
                    }
                   
                }
error:
                throw new Exception("Uart receving error!");
            }
        }
    }
}
