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
            public I2cController(SerialInterface serialPort) => this.serialPort = serialPort;

            public void I2cConfig(int speed_khz) {
                var cmd = $"i2ccfg({speed_khz})";

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();
            }

            public bool Write(byte address, byte[] data) => this.WriteRead(address, data, 0, data.Length, null, 0, 0);

            public bool Write(byte address, byte[] data, int offset, int count) => this.WriteRead(address, data, offset, count, null, 0, 0);

            public bool Read(byte address, byte[] data) => this.WriteRead(address, null, 0, 0, data, 0, data.Length);

            public bool Read(byte address, byte[] data, int offset, int count) => this.WriteRead(address, null, 0, 0, data, offset, count);

            public bool WriteRead(byte address, byte[] dataWrite, byte[] dataRead) => this.WriteRead(address, dataWrite, 0, dataWrite.Length, dataRead, 0, dataRead.Length);

            public bool WriteRead(byte address, byte[] dataWrite, int offsetWrite, int countWrite, byte[] dataRead, int offsetRead, int countRead) {
                if ((dataWrite == null && dataRead == null) || (countWrite == 0 && countRead == 0))
                    throw new ArgumentNullException();

                if (dataWrite != null && offsetWrite + countWrite > dataWrite.Length)
                    throw new ArgumentOutOfRangeException();

                if (dataRead != null && offsetRead + countRead > dataRead.Length)
                    throw new ArgumentOutOfRangeException();

                
                var write_array = string.Empty;

                write_array = "[";

                for (var i = 0; i < countWrite; i++) {
                    write_array += dataRead[i];

                    if (i < countWrite - 1)
                        write_array += ",";
                }

                write_array += "]";

                var cmd = $"i2cwr({address},{write_array},0)";

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;
            }


            
        }
    }
}
