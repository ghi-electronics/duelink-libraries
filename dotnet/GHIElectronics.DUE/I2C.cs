using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using static GHIElectronics.DUE.SerialInterface;

namespace GHIElectronics.DUE {
    public partial class DUEController {

        public class I2cController {

            SerialInterface serialPort;
            public I2cController(SerialInterface serialPort) => this.serialPort = serialPort;

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

                CmdRespone res;
                var cmd = string.Format("i2cstream({0},{1},{2})", address, countWrite, countRead) ;

                this.serialPort.WriteCommand(cmd);

                if (countWrite > 0) {
                    res = this.serialPort.ReadRespone(); // Read '&' to check device ready before send

                    if (!res.success) {

                        throw new Exception("I2C error: " + res.respone);
                    }

                    this.serialPort.WriteRawData(dataWrite, offsetWrite, countWrite);
                }

                if (countRead > 0) {                    

                    if (this.serialPort.ReadRawData(dataRead, offsetRead, countRead) != countRead) {


                        throw new Exception("I2C read raw data error.");
                    }
                }

                res = this.serialPort.ReadRespone();
                return res.success;

            }


            [Obsolete("This method is for testing I2C bytes purpose. Use i2cstream (WriteRead) instead. No need to implement when making driver.", false)]
            public bool I2cBytes(byte address, byte[]? dataWrite, int offsetWrite, int countWrite, byte[]? dataRead, int offsetRead, int countRead) {

                if ((dataWrite == null && dataRead == null) || (countWrite == 0 && countRead == 0))
                    throw new Exception("At least one of dataWrite or dataRead must be specified");

                if (dataWrite == null && countWrite != 0 )
                    throw new ArgumentNullException();

                if (dataRead == null  && countRead != 0)
                    throw new ArgumentNullException();

                if (dataWrite != null && offsetWrite + countWrite > dataWrite.Length)
                    throw new ArgumentOutOfRangeException();

                if (dataRead != null && offsetRead + countRead > dataRead.Length)
                    throw new ArgumentOutOfRangeException();

                if (countWrite > 4 || countRead > 4)
                    throw new Exception("I2cBytes max read: 4. Max write: 4");

                var cmd_var = new string[countWrite];               

                for (var i = 0; i < countWrite; i++) {
                    var variable = (char)('a' + i);

                    cmd_var[i] = string.Format("{0}={1}", variable, dataWrite[offsetWrite + i]);
                }

                CmdRespone res;
                for (var i = 0; i < countWrite; i++) {
                    this.serialPort.WriteCommand(cmd_var[i]);

                    res = this.serialPort.ReadRespone();

                    if (!res.success) {
                        return false;
                    }
                }

                var cmd = string.Format("i2cbytes({0},{1},{2})", address, countWrite, countRead);

                this.serialPort.WriteCommand(cmd);

                res = this.serialPort.ReadRespone();

                if (!res.success) {
                    return false;
                }

                try {
                    for (var i = 0;i < countRead; i++) {
                        var variable = (char)('a' + i);
                        cmd = string.Format("print({0})", variable);
                        this.serialPort.WriteCommand(cmd);

                        res = this.serialPort.ReadRespone();

                        if (!res.success) {
                            return false;
                        }

                        dataRead[offsetRead + i] = (byte)int.Parse(res.respone);
                    }
                }
                catch {
                    return false;
                }

                return true;
            }
        }
    }
}
