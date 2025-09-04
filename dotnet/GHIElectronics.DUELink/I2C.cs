using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using static GHIElectronics.DUELink.SerialInterface;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {

        public class I2cController {

            SerialInterface serialPort;
            StreamController stream;
            public I2cController(SerialInterface serialPort, StreamController stream) {
                this.serialPort = serialPort;
                this.stream = stream;
            }

            public bool Configuration(int speed_khz) {
                var cmd = $"i2ccfg({speed_khz})";

                this.serialPort.WriteCommand(cmd);

                var ret = this.serialPort.ReadResponse();

                return ret.success;
            }

            //public bool Write(byte address, byte[] data) => this.WriteRead(address, data, 0, data.Length, null, 0, 0);

            //public bool Write(byte address, byte[] data, int offset, int count) => this.WriteRead(address, data, offset, count, null, 0, 0);

            //public bool Read(byte address, byte[] data) => this.WriteRead(address, null, 0, 0, data, 0, data.Length);

            //public bool Read(byte address, byte[] data, int offset, int count) => this.WriteRead(address, null, 0, 0, data, offset, count);

            public bool WriteRead(byte address, byte[] dataWrite, byte[] dataRead) {
                var writeLenghth = 0;
                var readLenghth = 0;

                if (dataWrite != null)
                    writeLenghth = dataWrite.Length;

                if (dataRead != null)
                    readLenghth = dataRead.Length;

                return this.WriteRead(address, dataWrite, 0, writeLenghth, dataRead, 0, readLenghth);


            }

            private bool WriteRead(byte address, byte[] dataWrite, int offsetWrite, int countWrite, byte[] dataRead, int offsetRead, int countRead) {
                if ((dataWrite == null && dataRead == null) || (countWrite == 0 && countRead == 0))
                    throw new ArgumentNullException();

                if (dataWrite != null && offsetWrite + countWrite > dataWrite.Length)
                    throw new ArgumentOutOfRangeException();

                if (dataRead != null && offsetRead + countRead > dataRead.Length)
                    throw new ArgumentOutOfRangeException();


                //var write_array = string.Empty;

                //write_array = "[";

                //for (var i = 0; i < countWrite; i++) {
                //    write_array += dataWrite[i];

                //    if (i < countWrite - 1)
                //        write_array += ",";
                //}

                //write_array += "]";

                //var cmd = $"i2cwr({address},{write_array},0)";


                // using stream to do write/read

                var cmd = string.Empty;
                var written = 0;
                var read = 0;

                if (countWrite > 0) {
                    // declare b9 to write
                    cmd = $"dim b9[{countWrite}]";
                    this.serialPort.WriteCommand(cmd);
                    this.serialPort.ReadResponse();
                }

                if (countRead > 0) {
                    // declare b8 to write
                    cmd = $"dim b8[{countRead}]";
                    this.serialPort.WriteCommand(cmd);
                    this.serialPort.ReadResponse();
                }

                if (countWrite > 0) {
                    // write data to b9 by stream
                    var write_array = new byte[countWrite];
                    Array.Copy(dataWrite, offsetWrite, write_array, 0, countWrite);
                    written = this.stream.WriteBytes("b9", write_array);
                }

                // issue i2cwr cmd
                if (countWrite > 0 && countRead>0)
                    cmd = $"i2cwr({address},b9,b8)";
                else if (countWrite > 0) {
                    cmd = $"i2cwr({address},b9,0)";
                }
                else {
                    cmd = $"i2cwr({address},0,b8)";
                }
                this.serialPort.WriteCommand(cmd);
                this.serialPort.ReadResponse();

                if (countRead > 0) {
                    // use stream to read data to b8
                    var read_array = new byte[countRead];
                    read = this.stream.ReadBytes("b8", read_array);
                    Array.Copy(read_array, 0, dataRead, offsetRead, countRead);
                }

                
                return (written == countWrite) && (read == countRead);
            }



        }
    }
}
