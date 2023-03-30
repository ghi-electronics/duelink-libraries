using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.VisualBasic.FileIO;

namespace GHIElectronics.DUE {
    public partial class DUEController {
        public class LedController {

            SerialInterface serialPort;

            public LedController(SerialInterface serialPort) => this.serialPort = serialPort;

            public bool Set(int highPeriod, int lowPeriod, int count) {

                var cmd = string.Format("led({0},{1},{2})", highPeriod, lowPeriod, count);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;

            }            
        }
    }
}
