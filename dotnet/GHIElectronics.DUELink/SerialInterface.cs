using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Threading;
using System.Xml.Linq;

namespace GHIElectronics.DUELink {
    public class SerialInterface {



        protected const string CommandCompleteText = ">";

        protected SerialPort port;
        public bool EnabledAsio { get; set; } = true;

        //private string leftOver;

        protected const int DefaultBaudRate = 115200;

        object objlock;



        public TimeSpan ReadTimeout { get; set; } = new TimeSpan(0, 0, 0, 3);
        public string PortName { get; } = string.Empty;

        internal DeviceConfiguration DeviceConfig { get; set; }

        //private bool isPulseFamily = false;
        public SerialInterface(string portName) {

            //this.leftOver = string.Empty;

            this.objlock = new object();
            this.PortName = portName;
        }


        public virtual void Connect() {
            this.port = new SerialPort(this.PortName, DefaultBaudRate, Parity.None, 8, StopBits.One);
            //this.leftOver = "";

            this.port.Open();

            Thread.Sleep(100);

            this.Synchronize();
        }


        public int BytesToRead() => this.port.BytesToRead;

        public void DiscardInBuffer() => this.port.DiscardInBuffer();

        public void DiscardOutBuffer() => this.port.DiscardOutBuffer();


        public virtual void Disconnect() {

            try {
                this.port.Close();
                this.port.Dispose();
            }
            catch {

            }
            this.port = null;

        }

        public void Synchronize() {

            // Synchronize is no longer  send 127 because the device can be host which is runing a loop to control its clients.
            // We jusr send \n as first commands for chain enumeration

            this.WriteRawData(new byte[] { 10 }, 0, 1);

            Thread.Sleep(300);

            this.port.DiscardInBuffer();
            this.port.DiscardOutBuffer();

            // Send 127 code to exit running mode 
            //this.WriteRawData(new byte[] { 127 }, 0, 1);

            //Thread.Sleep(300);

            //this.port.DiscardInBuffer();
            //this.port.DiscardOutBuffer();

            //this.TurnEchoOff();

            //this.leftOver = "";

            //this.port.DiscardInBuffer();
            //this.port.DiscardOutBuffer();


            //var orig = this.ReadTimeout;

            //this.ReadTimeout = TimeSpan.FromSeconds(1);

            //this.port.ReadTimeout = (int)this.ReadTimeout.TotalMilliseconds;

            //var tryCount = 3;

            //while (tryCount-- > 0) {
            //    Thread.Sleep(10);

            //    this.leftOver = "";

            //    this.port.DiscardInBuffer();
            //    this.port.DiscardOutBuffer();

            //    try {
            //        //var version = this.GetVersion();

            //        var command = "version()";


            //        this.WriteCommand(command);


            //        var version = this.ReadResponse();


            //        if (version.success) {

            //            if (version.response != string.Empty && version.response.Contains(command)) {
            //                this.TurnEchoOff();

            //            }
            //            if (version.response != string.Empty && version.response.Contains("GHI Electronics")) {
            //                break;
            //            }
            //        }
            //    }
            //    catch {

            //    }
            //}

            //this.ReadTimeout = orig;
            //this.port.ReadTimeout = (int)this.ReadTimeout.TotalMilliseconds;
        }

        private bool Echo { get; set; } = true;



        //public void TurnEchoOff() {
        //    if (!this.Echo)
        //        return;

        //    this.WriteCommand("echo(0)");

        //    this.ReadResponse();

        //    this.Echo = false;


        //}

        //internal string RemoveEchoRespone(string respone, string cmd) {

        //    if (respone.Contains(cmd)) {
        //        respone = respone.Substring(cmd.Length, respone.Length - cmd.Length);
        //    }

        //    return respone;
        //}


        //private void CheckResult(string actual, string expected)
        //{
        //    if (actual != expected)
        //        throw new UnexpectedResultException($"Expected {expected}, got {actual}.");
        //}
        //public void WriteCommand(char command) => this.WriteLine(new string(command, 1));        
        public void WriteCommand(string command) {

            this.DiscardInBuffer();
            this.DiscardOutBuffer();


            var cmd_lowcase = command.ToLower();
            // these commands - statement can't use with println
            if (cmd_lowcase.IndexOf("print") == 0
                || cmd_lowcase.IndexOf("dim") == 0
                || cmd_lowcase.IndexOf("run") == 0
                || cmd_lowcase.IndexOf("list") == 0
                || cmd_lowcase.IndexOf("new") == 0
                || cmd_lowcase.IndexOf("echo") == 0
                || cmd_lowcase.IndexOf("sel") == 0
                || cmd_lowcase.IndexOf("version") == 0
                || cmd_lowcase.IndexOf("region") == 0
                || cmd_lowcase.IndexOf("alias") == 0
                || cmd_lowcase.IndexOf("sprintf") == 0
                ) {
                this.WriteLine(command);
            }

            else if (this.EnabledAsio) {
                var newcmd = string.Format("println({0})", command);

                this.WriteLine(newcmd);
            }
            else {
                this.WriteLine(command);
            }
        }

        private void WriteLine(string str) {
            str += '\n';

            this.port.Write(Encoding.UTF8.GetBytes(str), 0, Encoding.UTF8.GetByteCount(str));
        }


        public CmdResponse ReadResponse() {
            var str = string.Empty;// this.leftOver;
            var end = DateTime.UtcNow.Add(this.ReadTimeout).Ticks;

            var response = new CmdResponse();
            var responseValid = true;
            var dump = 0;
            var total_receviced = 0;

            lock (this.objlock) {
                while (end > DateTime.UtcNow.Ticks) {

                    if (this.port.BytesToRead > 0) {

                        var data = this.port.ReadByte();

                        str += (char)data;

                        total_receviced++;

                        if (data == '\n') {
                            if (this.port.BytesToRead == 0) {
                                Thread.Sleep(1); // wait 1ms for sure
                            }

                            // next byte can be >, &, !, $
                            if (this.port.BytesToRead > 0) {
                                dump = this.port.ReadByte();

                                if (dump == '>' || dump == '!' || dump == '$') {
                                    // valid data         
                                    Thread.Sleep(1); // wait 1ms for sure next byte

                                    if (this.port.BytesToRead > 0) {
                                        responseValid = false; // still data, this is bad response, there is no \r\n>xxxx
                                    }
                                }
                                //else if (dump == '\r') {
                                //    // from v036, this case not happened any more. We change Asio(1) to return
                                //    // there is case 0\r\n\r\n> if use println("btnup(0)") example, this is valid
                                //    if (this.port.BytesToRead == 0)
                                //        Thread.Sleep(1); // wait 1ms for sure next byte

                                //    if (this.port.BytesToRead > 0) {
                                //        dump = this.port.ReadByte();

                                //        if (dump == '\n') {
                                //            if (this.port.BytesToRead > 0)
                                //                dump = this.port.ReadByte();

                                //        }
                                //        else {
                                //            responseValid = false;
                                //        }
                                //    }
                                //    else {
                                //        responseValid = false;
                                //    }
                                //}
                                else {
                                    // bad data
                                    // One cmd send suppose one response, there is no 1234\r\n5678.... this will consider invalid response
                                    responseValid = false;
                                }
                            }

                            // once bad response \r\nxxx... or \r\n>xxxx, mean next \r\n is comming, wait timeout to clear them to clean the bus if possible        
                            if (!responseValid) {
                                dump = 0;

                                // \r\n must be comming because \r\nxxxx....\r\n         
                                while (dump != '\n' && end > DateTime.UtcNow.Ticks) {
                                    if (this.port.BytesToRead > 0) {
                                        dump = this.port.ReadByte();
                                    }
                                    else {
                                        Thread.Sleep(1);
                                    }

                                    if (dump == '\n') {
                                        if (this.port.BytesToRead > 0) { // still bad data, repeat clean up
                                            dump = 0; // reset to repeat the condition while loop
                                        }
                                    }
                                }
                            }

                            // reponse valid has to be xxx\r\n or \r\n, mean idx >=2
                            if (str == string.Empty || str.Length < 2) {
                                responseValid = false;
                            }
                            else if (responseValid) {
                                if (str[str.Length - 2] != '\r') {
                                    responseValid = false;
                                }
                                else {
                                    // valid response, remove \r\n
                                    str = str.Replace("\n", string.Empty);
                                    str = str.Replace("\r", string.Empty);
                                }
                            }

                            break;
                        }


                        end = DateTime.UtcNow.Add(this.ReadTimeout).Ticks; // reset timeout when new data come                        
                    }
                }

                //this.leftOver = string.Empty;
                this.port.DiscardInBuffer();
                this.port.DiscardOutBuffer();
            }

            response.success = total_receviced > 1 && responseValid;
            response.response = str;

            return response;
        }

        // this for read "list" command so read as is
        // when call list, there can be \n, > &.... so can not parse with ReadResponse
        public CmdResponse ReadResponse2() {
            var str = string.Empty;// this.leftOver;
            var end = DateTime.UtcNow.Add(this.ReadTimeout).Ticks;

            var response = new CmdResponse();


            lock (this.objlock) {

                while (end > DateTime.UtcNow.Ticks) {

                    if (this.port.BytesToRead > 0) {
                        var data = this.port.ReadByte();

                        str += (char)data;

                        end = DateTime.UtcNow.Add(this.ReadTimeout).Ticks; // reset timeout


                    }
                }

                this.port.DiscardInBuffer();
                this.port.DiscardOutBuffer();
            }

            if (str != string.Empty) {
                if (str.Length >= 3) {
                    response.response = str.Substring(0, str.Length - 3);
                }

                response.success = true;
            }



            return response;
        }



        int transferBlockSizeMax2 = 512;
        public int TransferBlockSizeMax {
            get {

                return this.transferBlockSizeMax2; ;

            }
            set {
                this.transferBlockSizeMax2 = value; ;
            }
        }

        //int transferBlockDelay1 = 2;
        int transferBlockDelay2 = 10;
        public int TransferBlockDelay {
            get {
                return this.transferBlockDelay2; ;

            }
            set {
                this.transferBlockDelay2 = value; ;
            }
        }

        public void WriteRawData(byte[] buffer, int offset, int count) {


            var block = count / this.TransferBlockSizeMax;
            var remain = count % this.TransferBlockSizeMax;

            var idx = offset;

            lock (this.objlock) {

                while (block > 0) {
                    this.port.Write(buffer, idx, this.TransferBlockSizeMax);
                    idx += this.TransferBlockSizeMax;
                    block--;
                    Thread.Sleep(this.TransferBlockDelay);
                }

                if (remain > 0) {
                    this.port.Write(buffer, idx, remain);

                    //Thread.Sleep(this.TransferBlockDelay);
                }
            }



        }
        public int ReadRawData(byte[] buffer, int offset, int count) {
            var end = DateTime.UtcNow.Add(this.ReadTimeout).Ticks;

            //if (this.leftOver.Length > 0) {
            //    // this should not be happened

            //    throw new InvalidOperationException("LeftOver size is different zero: " + this.leftOver.Length);

            //}


            var countleft = count;
            var totalRead = 0;

            lock (this.objlock) {

                while (end > DateTime.UtcNow.Ticks) {

                    var read = this.port.Read(buffer, offset + totalRead, count - totalRead);
                    totalRead += read;

                    if (read > 0) { // update last read success
                        end = DateTime.UtcNow.Add(this.ReadTimeout).Ticks;
                    }

                    if (totalRead == count) {
                        break;
                    }


                }
            }


            return totalRead;
        }

        public byte ReadByte() => (byte)this.port.ReadByte();


        //public string ReadLine()
        //{
        //    var str = this.leftOver;
        //    var end = DateTime.UtcNow.Add(this.ReadTimeout).Ticks;

        //    while (end > DateTime.UtcNow.Ticks)
        //    {
        //        str += this.port.ReadExisting();

        //        str = str.Replace("\n", string.Empty);

        //        var idx = str.IndexOf("\r");

        //        if (idx == -1)
        //        {
        //            Thread.Sleep(1);

        //            continue;
        //        }

        //        this.leftOver = str.Substring(idx + 1);

        //        return str.Substring(0, idx);
        //    }

        //    this.leftOver = string.Empty;

        //    this.port.DiscardInBuffer();
        //    this.port.DiscardOutBuffer();

        //    return string.Empty;
        //}

        public class CmdResponse {
            public string response = string.Empty;
            public bool success = false;
        };

    }
}
