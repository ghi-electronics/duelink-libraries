using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class SoundController {
            SerialInterface serialPort;
            StreamController stream;

            public SoundController(SerialInterface serialPort, StreamController stream) {
                this.serialPort = serialPort;
                this.stream = stream;
            }

            public bool Beep(int pin, uint frequency, uint duration_ms) {               

                if (pin < 0 || (pin >= this.serialPort.DeviceConfig.MaxPinIO ))
                    throw new Exception("Invalid pin.");

                var cmd = string.Format("beep({0},{1},{2})", pin, frequency, duration_ms);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadResponse();

                return res.success;


            }

            public bool MelodyPlay(int pin, float[] notes) {
                if (pin < 0 || Array.IndexOf(this.serialPort.DeviceConfig.PWMPins, pin) == -1)
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                //var cmd_dim_array = string.Format("dim a1[{0}]", notes.Length);

                //this.serialPort.WriteCommand(cmd_dim_array);

                //var res = this.serialPort.ReadResponse();

                //for (var i = 0; i < notes.Length; i++) {
                //    cmd_dim_array = string.Format("a1[{0}] = {1}", (i), notes[i]);

                //    this.serialPort.WriteCommand(cmd_dim_array);

                //    res = this.serialPort.ReadResponse();

                //    if (!res.success) {
                //        break;
                //    }
                //}

                var cmd = $"dim a9[{notes.Length}]";
                this.serialPort.WriteCommand(cmd);
                this.serialPort.ReadResponse();

                var written = this.stream.WriteFloats("a9", notes);

                cmd = $"MelodyP({pin},a9)";
                this.serialPort.WriteCommand(cmd);

                var ret = this.serialPort.ReadResponse();

                return ret.success;                

            }

            public bool MelodyStop(int pin) {
                if (pin < 0 || Array.IndexOf(this.serialPort.DeviceConfig.PWMPins, pin) == -1)
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                var cmd = $"MelodyS({pin})";


                this.serialPort.WriteCommand(cmd);

                var ret = this.serialPort.ReadResponse();

                return ret.success;
            }

            public bool Wave(int pin, byte[] buffer, int offset, int count, int freq, int delay_us) {

                var cmd = $"dim b9[{buffer.Length}]";
                this.serialPort.WriteCommand(cmd);
                this.serialPort.ReadResponse();

                var written = this.stream.WriteBytes("b9", buffer);

                cmd = $"Wave({pin}, b9,{offset}, {count},{freq}, {delay_us})";

                this.serialPort.WriteCommand(cmd);

                var ret = this.serialPort.ReadResponse();

                return ret.success;
            }

            public bool Sweep(int pin, int freq_start, int freq_end, int vol_start, int vol_end, int duration) {

                var cmd = $"Sweep({pin},{freq_start},{freq_end},{vol_start},{vol_end},{duration})";

                this.serialPort.WriteCommand(cmd);

                var ret = this.serialPort.ReadResponse();

                return ret.success;
            }
        }
    }
}
