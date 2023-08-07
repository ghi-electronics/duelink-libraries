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

            internal static int BUTTON_U = 85;
            internal static int BUTTON_D = 68;
            internal static int BUTTON_L = 76;
            internal static int BUTTON_R = 82;


            public int ButtonA { get; } = BUTTON_A;
            public int ButtonB { get; } = BUTTON_B;
            public int ButtonUp { get; } = BUTTON_U;
            public int ButtonDown { get; } = BUTTON_D;
            public int ButtonLeft { get; } = BUTTON_L;
            public int ButtonRight { get; } = BUTTON_R;
            public int Led { get; } = LED;
            public int Piezo { get; } = PIEZO;
            public int PullNone { get; } = PULLNONE;
            public int PullUp { get; } = PULLUP;
            public int PullDown { get; } = PULLDOWN;

        }
    }
}
