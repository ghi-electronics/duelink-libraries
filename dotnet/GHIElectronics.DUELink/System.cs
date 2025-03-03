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
            Bootloader


        }

        public class Version {
            public string Firmware;
            public string ProductId;
            public string Bootloader;
        }
        public class SystemController {

            SerialInterface serialPort;


            public SystemController(SerialInterface serialPort) {
                this.serialPort = serialPort; ;

                ;
            }

            

            public void Reset(int option) {

                var cmd = string.Format("reset({0})", (option > 0) ? 1 : 0);
                this.serialPort.WriteCommand(cmd);

                // The device will reset in bootloader or system reset
                this.serialPort.Disconnect();

            }

            public int GetTickMicroseconds() {
                var cmd = string.Format("log(tickus())");

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
                var cmd = string.Format("log(tickms())");

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



            

            

            public bool Wait(int millisecond) {

                var cmd = string.Format("wait({0})", millisecond);

                this.serialPort.WriteCommand(cmd);

                Thread.Sleep(millisecond);

                var res = this.serialPort.ReadRespone();

                return res.success;
            }

            //public string Version { get; internal set; }
            public Version GetVersion() {
                if (this._version == null) {
                    var command = "version()";


                    this.serialPort.WriteCommand(command);


                    var response = this.serialPort.ReadRespone();


                    if (response.success) {
                        if (response.respone != null) {
                            // echo is on=> need to turn off
                            this._version = new Version();

                            this.serialPort.TurnEchoOff();

                            this.serialPort.DiscardInBuffer();
                            this.serialPort.DiscardOutBuffer();

                            var versions = response.respone.Substring(25).Split(':');

                            this._version.Firmware = versions[0];
                            this._version.ProductId = versions[1];
                            this._version.Bootloader = versions[2];
                            
                        }
                    }
                }

                return this._version;
            }

            private Version _version;

        }
    }
}
