using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Threading;
using System.Xml.Linq;

namespace GHIElectronics.DUE {
    public class SerialInterface {

        

        protected const string CommandCompleteText = ">";

        protected SerialPort port;

        private string leftOver;

        protected const int DefaultBaudRate = 115200;

        object objlock;



        public TimeSpan ReadTimeout { get; set; } = new TimeSpan(0, 0, 0, 3);
        public string PortName { get; } = string.Empty;

        internal DeviceConfiguration DeviceConfig { get; set; }

        //private bool isPulseFamily = false;
        public SerialInterface(string portName) {

            this.leftOver = string.Empty;

            this.objlock = new object();
            this.PortName = portName;
        }


        public virtual void Connect() {
            this.port = new SerialPort(this.PortName, DefaultBaudRate, Parity.None, 8, StopBits.One);
            this.leftOver = "";

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

            // Send 127 code to exit running mode 
            this.WriteRawData(new byte[] { 127 }, 0, 1);


            var orig = this.ReadTimeout;

            this.ReadTimeout = TimeSpan.FromSeconds(1);

            this.port.ReadTimeout = (int)this.ReadTimeout.TotalMilliseconds;

            var tryCount = 3;

            while (tryCount-- > 0) {
                Thread.Sleep(10);

                this.leftOver = "";

                this.port.DiscardInBuffer();
                this.port.DiscardOutBuffer();

                try {
                    var version = this.GetVersion();

                    if (version != string.Empty && version[2] == '.' && version[4] == '.' ) {                        
                        break;
                    }
                }
                catch {

                }
            }

            this.ReadTimeout = orig;
            this.port.ReadTimeout = (int)this.ReadTimeout.TotalMilliseconds;
        }

        private bool echo = true;

        private void TurnEchoOff() {
            if (!this.echo)
                return;

            this.WriteCommand("echo(0)");

            this.ReadRespone();

            this.echo = false;


        }
        public string GetVersion() {
            var command = "version()";


            this.WriteCommand(command);


            var version = this.ReadRespone();


            if (version.success) {
                if (this.echo && version.respone.Contains(command)) {
                    // echo is on=> need to turn off

                    this.TurnEchoOff();

                    this.port.DiscardInBuffer();
                    this.port.DiscardOutBuffer();

                    version.respone = version.respone.Substring(command.Length, version.respone.Length - command.Length);
                }
            }

            return version.respone;
        }

        internal string RemoveEchoRespone(string respone, string cmd) {

            if (respone.Contains(cmd)) {
                respone = respone.Substring(cmd.Length, respone.Length - cmd.Length);
            }

            return respone;
        }


        //private void CheckResult(string actual, string expected)
        //{
        //    if (actual != expected)
        //        throw new UnexpectedResultException($"Expected {expected}, got {actual}.");
        //}
        //public void WriteCommand(char command) => this.WriteLine(new string(command, 1));
        public void WriteCommand(string command) {

            this.DiscardInBuffer();
            this.DiscardOutBuffer();

            this.WriteLine(command);
        }

        private void WriteLine(string str) {
            str += '\n';

            this.port.Write(Encoding.UTF8.GetBytes(str), 0, Encoding.UTF8.GetByteCount(str));
        }


        public CmdRespone ReadRespone() {
            var str = this.leftOver;
            var end = DateTime.UtcNow.Add(this.ReadTimeout).Ticks;

            var respone = new CmdRespone();


            lock (this.objlock) {


                while (end > DateTime.UtcNow.Ticks) {

                    if (this.port.BytesToRead > 0) {
                        var data = this.port.ReadByte();



                        str += (char)data;

                        str = str.Replace("\n", string.Empty);
                        str = str.Replace("\r", string.Empty);

                        var idx1 = str.IndexOf(">");
                        var idx2 = str.IndexOf("&");

                        if (idx1 == -1)
                            idx1 = str.IndexOf("$");

                        if (idx1 == -1 && idx2 == -1) {
                            //Thread.Sleep(1);


                            continue;
                        }

                        var idx = idx1 == -1 ? idx2 : idx1;

                        this.leftOver = str.Substring(idx + 1);

                        respone.success = true;
                        respone.respone = str.Substring(0, idx);

                        //return str.Substring(0, idx);
                        var idx3 = str.IndexOf("!");

                        if (idx3 != -1 ) {
                            //respone.respone = respone.respone.Substring(0, respone.respone);
                            respone.success = false;
                        }


                        return respone;
                    }

                }

                this.leftOver = string.Empty;

                this.port.DiscardInBuffer();
                this.port.DiscardOutBuffer();
            }

            respone.success = false;
            respone.respone = string.Empty;

            return respone;
        }

        public CmdRespone ReadRespone2() {
            var str = this.leftOver;
            var end = DateTime.UtcNow.Add(this.ReadTimeout).Ticks;

            var respone = new CmdRespone();


            lock (this.objlock) {


                while (end > DateTime.UtcNow.Ticks) {

                    if (this.port.BytesToRead > 0) {
                        var data = this.port.ReadByte();



                        str += (char)data;

                        //str = str.Replace("\n", string.Empty);
                        //str = str.Replace("\r", string.Empty);

                        var idx1 = str.IndexOf(">");
                        var idx2 = str.IndexOf("&");

                        if (idx1 == -1)
                            idx1 = str.IndexOf("$");

                        if (idx1 == -1 && idx2 == -1) {
                            //Thread.Sleep(1);


                            continue;
                        }

                        var idx = idx1 == -1 ? idx2 : idx1;

                        this.leftOver = str.Substring(idx + 1);

                        respone.success = true;
                        respone.respone = str.Substring(0, idx);

                        //return str.Substring(0, idx);
                        var idx3 = str.IndexOf("!");

                        if (idx3 != -1 && (respone.respone.Contains("error") || respone.respone.Contains("unknown"))) {
                            //respone.respone = respone.respone.Substring(0, respone.respone);
                            respone.success = false;
                        }


                        return respone;
                    }

                }

                this.leftOver = string.Empty;

                this.port.DiscardInBuffer();
                this.port.DiscardOutBuffer();
            }

            respone.success = false;
            respone.respone = string.Empty;

            return respone;
        }



        public int TransferBlockSizeMax {
            get {
                if (this.DeviceConfig != null && !this.DeviceConfig.IsEdge)
                    return 1024;
                else return 512;

            }
        }
        public int TransferBlockDelay {
            get {
                if (this.DeviceConfig != null && !this.DeviceConfig.IsEdge)
                    return 2;
                else return 5;

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

                    Thread.Sleep(this.TransferBlockDelay);
                }
            }



        }
        public int ReadRawData(byte[] buffer, int offset, int count) {
            var end = DateTime.UtcNow.Add(this.ReadTimeout).Ticks;

            if (this.leftOver.Length > 0) {
                // this should not be happened

                throw new InvalidOperationException("LeftOver size is different zero: " + this.leftOver.Length);

            }


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

        public class CmdRespone {
            public string respone;
            public bool success;
        };

        //public class UnexpectedResultException : Exception
        //{
        //    internal UnexpectedResultException() { }
        //    internal UnexpectedResultException(string message) : base(message) { }
        //    internal UnexpectedResultException(string message, Exception innerException) : base(message, innerException) { }
        //}

        //public class UploadProgressEventArgs : EventArgs
        //{
        //    public int BytesSent { get; set; }
        //    public int BytesRemaining { get; set; }
        //    public string Status { get; set; }

        //    public UploadProgressEventArgs(int sent, int remaining, string status)
        //    {
        //        this.BytesSent = sent;
        //        this.BytesRemaining = remaining;
        //        this.Status = status;
        //    }
        //}
    }
}
