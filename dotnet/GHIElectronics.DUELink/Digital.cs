using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using static GHIElectronics.DUELink.DUELinkController.DigitalController;

namespace GHIElectronics.DUELink {
    public partial class DUELinkController {
        public enum InputType {
            None = 0,
            PullUp = 1,
            PullDown = 2,
        }
        public class DigitalController {

           

            SerialInterface serialPort;

            public DigitalController(SerialInterface serialPort) => this.serialPort = serialPort;

          

            public bool Read(int pin, InputType inputType = InputType.None) {
                if (pin < 0 || (pin >= this.serialPort.DeviceConfig.MaxPinIO ))
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                var input = (int)inputType;

              
            

                var cmd = string.Format("dread({0},{1})", pin.ToString(), input.ToString());



                this.serialPort.WriteCommand(cmd);

                var response = this.serialPort.ReadResponse();

                if (response.success) {

                   
                    try {
                        var value = int.Parse(response.response);

                        return value == 1;
                    }
                    catch { }

                    
                }

                return false;
            }
            

            public bool Write(int pin, bool value) {
                if (pin < 0 || (pin >= this.serialPort.DeviceConfig.MaxPinIO ))
                    throw new ArgumentOutOfRangeException("Invalid pin.");

                var v = (value == true ? 1 : 0);

                var cmd = string.Format("dwrite({0},{1})", pin, (value == true ? 1 : 0));

                this.serialPort.WriteCommand(cmd);

                var response = this.serialPort.ReadResponse();

                return response.success;
            }

           
        }

       
    }
}
