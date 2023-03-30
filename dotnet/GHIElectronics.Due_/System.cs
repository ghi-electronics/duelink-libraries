using System;
using System.Collections.Generic;
using System.Diagnostics.Contracts;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUE {

    public partial class DUEController {

        public enum ResetOption {
            SystemReset = 0,
            Bootloader
            

        }
        public class SystemController {

            SerialInterface serialPort;

            public SystemController(SerialInterface serialPort) => this.serialPort = serialPort;

            public void Reset(ResetOption option) {

                var cmd = string.Format("reset({0})", option == ResetOption.Bootloader ? 1 : 0 );
                this.serialPort.WriteCommand(cmd);

                // The device will reset in bootloader or system reset
                this.serialPort.Disconnect();

            }

            public int GetTickMicroseconds() {
                var cmd = string.Format("print(tickus())");

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                if (res.success) {
                    try {
                        var tick = int.Parse(res.respone);
                        return tick;
                    }
                    catch {

                    }

                }

                return -1;
            }

            public int GetTickMilliseconds() {
                var cmd = string.Format("print(tickms())");

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                if (res.success) {
                    try {
                        var tick = int.Parse(res.respone);
                        return tick;
                    }
                    catch {

                    }

                }

                return -1;
            }

            
        }
    }
}
