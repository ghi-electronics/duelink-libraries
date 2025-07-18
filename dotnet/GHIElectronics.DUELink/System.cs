using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Diagnostics.Contracts;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace GHIElectronics.DUELink {

    public partial class DUELinkController {

        public enum ResetOption {
            SystemReset = 0,
            EraseAll = 1,
        }
        public class SystemController {

            SerialInterface serialPort;


            public SystemController(SerialInterface serialPort) {
                this.serialPort = serialPort; ;

                ;
            }

            public void Reset(ResetOption option) {

                var cmd = $"reset({option.ToString()})";

                this.serialPort.WriteCommand(cmd);

                // Erase all send reset twice
                if (option == ResetOption.EraseAll) 
                    this.serialPort.WriteCommand(cmd);

                // The device will reset in bootloader or system reset
                this.serialPort.Disconnect();

            }

            public int GetTickMicroseconds() {
                var cmd = string.Format("tickus())=");

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                if (res.success) {
                    try {
                        var tick = int.Parse(res.response);
                        return tick;
                    }
                    catch {

                    }

                }

                return -1;
            }

            public int GetTickMilliseconds() {
                var cmd = string.Format("tickms()");

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                if (res.success) {
                    try {
                        var tick = int.Parse(res.response);
                        return tick;
                    }
                    catch {

                    }

                }

                return -1;
            }
            
            //public Version GetVersion() {
            //    if (this._version == null) {
            //        var command = "version()";


            //        this.serialPort.WriteCommand(command);


            //        var response = this.serialPort.ReadResponse();


            //        if (response.success) {
            //            if (response.response != null) {

            //                this._version = new Version();

                            


            //                var versions = response.response.Substring(25).Split(':');

            //                this._version.Firmware = versions[0];
            //                this._version.ProductId = versions[1];
            //                this._version.Bootloader = versions[2];
                            
            //            }
            //        }
            //    }

            //    return this._version;
            //}

            public int Info(int code) {
                var cmd = string.Format("info({0})", code.ToString());

                this.serialPort.WriteCommand(cmd);

                var response = this.serialPort.ReadResponse();

                if (response.success) {


                    try {
                        var value = int.Parse(response.response);

                        return value;
                    }
                    catch { }


                }

                return 0;

            }

            private Version _version;

            public bool StatLed(int highPeriod, int lowPeriod, int count) {

                var cmd = string.Format("statled({0},{1},{2})", highPeriod, lowPeriod, count);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;

            }
            public void Shtdn(int wkpin) {

                var cmd = string.Format("shtdn({0})", wkpin);

                this.serialPort.WriteCommand(cmd);

                this.serialPort.ReadResponse();

            }
        }
    }
}
