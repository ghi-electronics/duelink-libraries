using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Diagnostics.Contracts;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace GHIElectronics.DUELink {

    public partial class DUELinkController {

        public enum ResetOption {
            SystemReset = 0,
            Bootloader


        }
        public class SystemController {

            SerialInterface serialPort;
            //DisplayController display;
            

            //int DISPLAY_MAX_LINES = 8;
            //int DISPLAY_MAX_CHARACTER_PER_LINE = 21;

            public SystemController(SerialInterface serialPort) {
                this.serialPort = serialPort;

                //this.UpdateDisplay(display);
            }

            //internal void UpdateDisplay(DisplayController display) {
            //    this.display = display; 

            //    DISPLAY_MAX_LINES = this.display.Height / 8;
            //    DISPLAY_MAX_CHARACTER_PER_LINE = this.display.Width / 6;

            //    print_posx = 0;

            //    this.displayText = new string[DISPLAY_MAX_LINES];
            //    for (var i = 0; i < DISPLAY_MAX_LINES; i++) {
            //        displayText[i] = string.Empty;
            //    }
            //}

            public void Reset(ResetOption option) {

                var cmd = string.Format("reset({0})", option == ResetOption.Bootloader ? 1 : 0);
                this.serialPort.WriteCommand(cmd);

                // The device will reset in bootloader or system reset
                this.serialPort.Disconnect();

            }

            public int GetTickMicroseconds() {
                var cmd = string.Format("log(tickus())");

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                if (res.success) {
                    try {
                        var tick = int.Parse(res.respone);
                        return tick;
                    }
                    catch {

                    }

                }

                return -1;
            }

            public int GetTickMilliseconds() {
                var cmd = string.Format("log(tickms())");

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                if (res.success) {
                    try {
                        var tick = int.Parse(res.respone);
                        return tick;
                    }
                    catch {

                    }

                }

                return -1;
            }

            public bool Beep(int pin, uint frequency, uint durationms) {
                if (durationms > 1000) {
                    throw new Exception("Max duration is 1000 (one second)");
                }

                if (frequency > 10000) {
                    throw new Exception("Frequency is within range[0,10000] Hz");
                }

                if (pin < 0 || (pin >= this.serialPort.DeviceConfig.MaxPinIO && pin != (int)PinController.PIEZO))
                    throw new Exception("Invalid pin.");

                var cmd = string.Format("beep({0},{1},{2})", pin, frequency, durationms);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();

                return res.success;


            }

            public bool Beep(char pin, uint frequency, uint durationms) {
                if (pin == 'p' || pin == 'P') {
                    return this.Beep((int)PinController.PIEZO, frequency, durationms);
                }

                return false;
            }

            //string[] displayText;

            //int print_posx = 0;
            //private void PrnChar(char c) {
            //    if (print_posx == DISPLAY_MAX_CHARACTER_PER_LINE && c != '\r' && c != '\n')
            //        return;


            //    if (c == '\r' || c == '\n') {
            //        print_posx = 0;

            //        for (var i = 1; i < DISPLAY_MAX_LINES; i++) { // move up the last line
            //            displayText[i - 1] = displayText[i];
            //        }

            //        displayText[DISPLAY_MAX_LINES - 1] = string.Empty;
            //    }
            //    else {
            //        displayText[DISPLAY_MAX_LINES - 1] += c;
            //        print_posx++;
            //    }

            //}

            private void PrnText(string text, bool newline) {
                //for (var i = 0; i < text.Length; i++) {
                //    this.PrnChar(text[i]);
                //}

                //display.Clear(0);

                //for (var i = 0; i < displayText.Length; i++) {
                //    if (displayText[i] != string.Empty) {
                //        display.DrawText(displayText[i], 1, 0, i * 8);
                //    }

                //}

                //display.Show();

                //if (newline) {
                //    this.PrnChar('\r');
                //}
                
                var cmd = string.Format(newline ? "println(\"{0}\")" : "print(\"{0}\")", text);

                this.serialPort.WriteCommand(cmd);

                var res = this.serialPort.ReadRespone();
               
            }
            public bool Print(string text) {

                Debug.Write(text);

                this.PrnText(text, false);

                return true;


            }

            public bool Print(int value) {
                return this.Print(value.ToString());
            }

            public bool Print(bool value) {
                return this.Print(value ? 1 : 0);
            }

            public bool Println(string text) {

                Debug.WriteLine(text);

                this.PrnText(text, true);

                return true;
            }

            public bool Println(int value) {
                return this.Println(value.ToString());
            }

            public bool Println(bool value) {
                return this.Println(value ? 1 : 0);
            }

            public bool Wait(int millisecond) {

                var cmd = string.Format("wait({0})", millisecond);

                this.serialPort.WriteCommand(cmd);

                Thread.Sleep(millisecond);

                var res = this.serialPort.ReadRespone();

                return res.success;
            }


        }
    }
}
