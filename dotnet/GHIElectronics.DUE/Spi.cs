using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using static GHIElectronics.DUE.DUEController;
using static GHIElectronics.DUE.SerialInterface;

namespace GHIElectronics.DUE {
    public partial class DUEController {

        public class SpiController {

            SerialInterface serialPort;
            public SpiController(SerialInterface serialPort) => this.serialPort = serialPort;

            public bool Write(byte[] dataWrite, int chipselect = -1) => this.WriteRead(dataWrite, 0, dataWrite.Length, null, 0, 0, chipselect);

            public bool Write(byte[] dataWrite, int offset, int count, int chipselect = -1) => this.WriteRead(dataWrite, offset, count, null, 0, 0, chipselect);
            public bool Read(byte[] dataRead, int chipselect = -1) => this.WriteRead(null, 0, 0, dataRead, 0, dataRead.Length, chipselect);

            public bool Read(byte[] dataRead, int offset, int count, int chipselect = -1) => this.WriteRead(null, 0, 0, dataRead, offset, count, chipselect);
            public bool WriteRead(byte[] dataWrite, byte[] dataRead, int chipselect = -1) => this.WriteRead(dataWrite, 0, dataWrite.Length, dataRead, 0, dataRead.Length, chipselect);

            public bool WriteRead(byte[]? dataWrite, int offsetWrite, int countWrite, byte[]? dataRead, int offsetRead, int countRead, int chipselect = -1) {
                if (chipselect >= this.serialPort.DeviceConfig.MaxPinIO)
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                if ((dataWrite == null && dataRead == null) || (countWrite == 0 && countRead == 0))
                    throw new ArgumentNullException();

                if (dataWrite != null && offsetWrite + countWrite > dataWrite.Length)
                    throw new ArgumentOutOfRangeException();

                if (dataRead != null && offsetRead + countRead > dataRead.Length)
                    throw new ArgumentOutOfRangeException();

                if (chipselect < 0)
                    chipselect = 255;

                CmdRespone res;
                var cmd = string.Format("spistream({0},{1},{2})", countWrite.ToString(), countRead.ToString(), chipselect.ToString());


                this.serialPort.WriteCommand(cmd);

                res = this.serialPort.ReadRespone();

                if (!res.success) {
                    return false;
                }

                while (countWrite > 0 || countRead > 0) {

                    var min = countWrite < countRead ? countWrite : countRead;

                    if (countWrite == 0)
                        min = countRead;

                    if (countRead == 0)
                        min = countWrite;

                    min = min < this.serialPort.TransferBlockSizeMax ? min : this.serialPort.TransferBlockSizeMax;

                    if (countWrite > 0) {
                        this.serialPort.WriteRawData(dataWrite, offsetWrite, min);
                        offsetWrite += min;
                        countWrite -= min;
                    }

                    if (countRead > 0) {
                        this.serialPort.ReadRawData(dataRead, offsetRead, min);
                        offsetRead += min;
                        countRead -= min;
                    }


                }

                res = this.serialPort.ReadRespone();
                return res.success;

            }

            [Obsolete("This method is for testing Spi bytes purpose. Use spistream (WriteRead) instead. No need to implement when making driver.", false)]
            public byte WriteByte(byte data) {

                CmdRespone res;
                var cmd = string.Format("print(spibyte({0}))", data.ToString());

                this.serialPort.WriteCommand(cmd);

                res = this.serialPort.ReadRespone();

                byte value = 0;

                if (res.success) {
                    try {
                        value = (byte)(int.Parse(res.respone));


                    }
                    catch {

                    }

                }
                return value;
            }

            public bool Write4bpp(byte[] dataWrite, int chipselect = -1) => this.Write4bpp(dataWrite, 0, dataWrite.Length, chipselect);

            public bool Write4bpp(byte[] dataWrite, int offset, int count, int chipselect = -1) {
                if (chipselect >= this.serialPort.DeviceConfig.MaxPinIO)
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                if (dataWrite == null)
                    throw new ArgumentNullException();

                if (dataWrite != null && offset + count > dataWrite.Length)
                    throw new ArgumentOutOfRangeException();

                var cmd = string.Format("spi4bpp({0},{1})", count.ToString(), chipselect.ToString());

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                if (!res.success) {
                    return false;
                }

                this.serialPort.WriteRawData(dataWrite, offset, count);

                res = this.serialPort.ReadRespone();
                return res.success;
            }

            public bool Pallete(int id, uint color) {
                if (id >= 16)
                    throw new ArgumentOutOfRangeException("Pallete supports 16 color index only.");


                var cmd = string.Format("palette({0},{1})", id.ToString(), color.ToString());

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();
                return res.success;

            }

            public bool Configuration(uint mode, uint frequencyKHz ) {
                if (mode > 3 )
                    throw new ArgumentOutOfRangeException("Mode must be in range 0...3.");

                if (frequencyKHz < 200 || frequencyKHz > 20000)
                    throw new ArgumentOutOfRangeException("FrequencyKHz must be in range 200KHz to 20MHz.");

                var cmd = string.Format("spicfg({0},{1})", mode.ToString(), frequencyKHz.ToString());

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();
                return res.success;
            }
        }
    }
}
