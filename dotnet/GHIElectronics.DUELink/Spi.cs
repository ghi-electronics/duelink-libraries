using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using static GHIElectronics.DUELink.DUELinkController;
using static GHIElectronics.DUELink.SerialInterface;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {

        public class SpiController {

            SerialInterface serialPort;
            StreamController stream;
            public SpiController(SerialInterface serialPort, StreamController stream) {
                this.serialPort = serialPort;
                this.stream = stream;
            }

            //public bool Write(byte[] dataWrite) => this.WriteRead(dataWrite, 0, dataWrite.Length, null, 0, 0);

            //public bool Write(byte[] dataWrite, int offset, int count) => this.WriteRead(dataWrite, offset, count, null, 0, 0);
            //public bool Read(byte[] dataRead) => this.WriteRead(null, 0, 0, dataRead, 0, dataRead.Length);

            //public bool Read(byte[] dataRead, int offset, int count) => this.WriteRead(null, 0, 0, dataRead, offset, count);
            public bool WriteRead(byte[] dataWrite, byte[] dataRead) => this.WriteRead(dataWrite, 0, dataWrite.Length, dataRead, 0, dataRead.Length);

            private bool WriteRead(byte[]? dataWrite, int offsetWrite, int countWrite, byte[]? dataRead, int offsetRead, int countRead) {
                
                if ((dataWrite == null && dataRead == null) || (countWrite == 0 && countRead == 0))
                    throw new ArgumentNullException();

                if (dataWrite != null && offsetWrite + countWrite > dataWrite.Length)
                    throw new ArgumentOutOfRangeException();

                if (dataRead != null && offsetRead + countRead > dataRead.Length)
                    throw new ArgumentOutOfRangeException();


                //var write_array = string.Empty;

                //write_array = "[";

                //for (var i = 0; i < countWrite; i++) {
                //    write_array += dataRead[i];

                //    if (i < countWrite - 1)
                //        write_array += ",";
                //}

                //write_array += "]";

                //var cmd = $"spiwrs({write_array},0)";

                //this.serialPort.WriteCommand(cmd);

                //var res = this.serialPort.ReadResponse();

                //return res.success;

                // using stream to do Spi writeread

                // declare b9 to write
                var cmd = $"dim b9[{countWrite}]";
                this.serialPort.WriteCommand(cmd);
                this.serialPort.ReadResponse();

                // declare b8 to write
                cmd = $"dim b8[{countRead}]";
                this.serialPort.WriteCommand(cmd);
                this.serialPort.ReadResponse();

                // write data to b9 by stream
                var write_array = new byte[countWrite];
                Array.Copy(dataWrite, offsetWrite, write_array, 0, countWrite);
                var written = this.stream.WriteBytes("b9", write_array);

                // i2c wr cmd
                cmd = $"spiwrs(b9,b8)";
                this.serialPort.WriteCommand(cmd);
                this.serialPort.ReadResponse();

                // use stream to read data to b8
                var read_array = new byte[countRead];
                var read = this.stream.ReadBytes("b8", read_array);

                Array.Copy(read_array, 0, dataRead, offsetRead, countRead);
                return (written == countWrite) && (read == countRead);

            }
          
            public bool Configuration(uint mode, uint frequencyKHz ) {
                if (mode > 3 )
                    throw new ArgumentOutOfRangeException("Mode must be in range 0...3.");

                if (frequencyKHz < 200 || frequencyKHz > 24000)
                    throw new ArgumentOutOfRangeException("FrequencyKHz must be in range 200KHz to 24MHz.");

                var cmd = string.Format("spicfg({0},{1})", mode.ToString(), frequencyKHz.ToString());

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();
                return res.success;
            }

            public int WriteByte(byte data) {
                var cmd = $"spiwr({data})";

                this.serialPort.WriteCommand(cmd);

                var response = this.serialPort.ReadResponse();

                if (response.success) {                    
                    try {
                        var value = int.Parse(response.response);

                        return (int)value;
                    }
                    catch {

                    }
                }

                return 0;
            }
        }
    }
}
