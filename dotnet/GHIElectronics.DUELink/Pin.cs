using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public class PinController {

            internal static int BUTTON_A = 97;
            internal static int BUTTON_B = 98;
            internal static int LED = 108;
            internal static int PIEZO = 112;
            internal static int PULLNONE = 0;
            internal static int PULLUP = 1;
            internal static int PULLDOWN = 2;

            public int ButtonA { get; } = BUTTON_A;
            public int ButtonB { get; } = BUTTON_B;
            public int Led { get; } = LED;
            public int Piezo { get; } = PIEZO;
            public int PullNone { get; } = PULLNONE;
            public int PullUp { get; } = PULLUP;
            public int PullDown { get; } = PULLDOWN;

        }
    }
}
