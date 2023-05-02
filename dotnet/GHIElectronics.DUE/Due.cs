
using System.Collections;
using System.Diagnostics;
using System.IO.Ports;
using System.Reflection.Metadata.Ecma335;
using System.Runtime.InteropServices;
using Microsoft.Win32;

namespace GHIElectronics.DUE {

    public class DeviceConfiguration {
        public bool IsPulse { get; internal set; } = false;
        public bool IsPico { get; internal set; } = false;
        public bool IsFlea { get; internal set; } = false;
        public bool IsEdge { get; internal set; } = false;
        public uint MaxPinIO { get; set; }
        public uint MaxPinAnalog { get; set; }


    }
    public partial class DUEController {

        public enum Pin {
            ButtonA = 97,
            ButtonB = 98,
            Led = 108,
        }

        SerialInterface serialPort = default!;

        public DeviceConfiguration DeviceConfig { get; set; }

        public AnalogController Analog { get; internal set; }
        public DigitalController Digital { get; internal set; }
        public I2cController I2c { get; internal set; }
        public ServoMotoController ServoMoto { get; internal set; }
        public SpiController Spi { get; internal set; }

        public FrequencyController Frequency { get; internal set; }

        public InfraredController Infrared { get; internal set; }

        public NeoController Neo { get; internal set; }

        public SystemController System { get; internal set; }

        public UartController Uart { get; internal set; }
        public ButtonController Button { get; internal set; }
        public DistanceSensorController Distance { get; internal set; }
        public SoundController Sound { get; internal set; }
        public DisplayController Display { get; internal set; }

        public TouchController Touch { get; internal set; }

        public LedController Led { get; internal set; }

        public ScriptController Script { get; internal set; }

        public string Version { get; internal set; } = string.Empty;

        public bool IsPulse { get; internal set; } = false;
        public bool IsPico { get; internal set; } = false;
        public bool IsFlea { get; internal set; } = false;
        public bool IsEdge { get; internal set; } = false;

      
        public int MaxIO { get; internal set; } 
        public int MaxAnalog { get; internal set; }

        public DUEController(string comPort) {
            if (comPort == null)
                throw new Exception(string.Format("Invalid comport: {0}", comPort));

            try {
                this.Connect(comPort);
            }
            catch {
                throw new Exception(string.Format("Could not connect to the comport: {0}", comPort));
            }

            if (this.serialPort == null) {
                throw new ArgumentNullException("serialPort is null");
            }

            this.Analog = new AnalogController(this.serialPort);
            this.Digital = new DigitalController(this.serialPort);
            this.I2c = new I2cController(this.serialPort);
            this.ServoMoto = new ServoMotoController(this.serialPort);
            this.Frequency = new FrequencyController(this.serialPort);
            this.Spi = new SpiController(this.serialPort);
            this.Infrared = new InfraredController(this.serialPort);
            this.Neo = new NeoController(this.serialPort);
            this.System = new SystemController(this.serialPort);
            this.Uart = new UartController(this.serialPort);
            this.Button = new ButtonController(this.serialPort);
            this.Distance = new DistanceSensorController(this.serialPort);
            this.Sound = new SoundController(this.serialPort);
            this.Display = new DisplayController(this.serialPort);
            this.Touch = new TouchController(this.serialPort);
            this.Led = new LedController(this.serialPort);
            this.Script = new ScriptController(this.serialPort);
            
        }

        private static IEnumerable<RegistryKey> GetSubKeys(RegistryKey key) {
            foreach (var keyName in key.GetSubKeyNames())
                using (var subKey = key.OpenSubKey(keyName))
                    yield return subKey;
        }
        static public string GetConnectionPort() {
            var vid = "VID_1B9F";
            var pid = "PID_F300";


            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows)) {
                var serialports = new ArrayList();

                using (var enumUsbKey = Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Enum\USB")) {
                    if (enumUsbKey != null) {
                        foreach (var devBaseKey in GetSubKeys(enumUsbKey)) {
                            foreach (var devFnKey in GetSubKeys(devBaseKey)) {
                                using (var devParamsKey = devFnKey.OpenSubKey("Device Parameters")) {
                                    var portName = (string)devParamsKey?.GetValue("PortName");
                                    if (portName != null) {

                                        if (devFnKey.Name.IndexOf(vid, StringComparison.InvariantCultureIgnoreCase) >=0) {

                                            if (devFnKey.Name.IndexOf(pid, StringComparison.InvariantCultureIgnoreCase) >= 0)  {
                                                serialports.Add(portName);
                                            }


                                        }


                                    }
                                }
                            }
                        }
                    }
                }

                try {
                    var key = Registry.LocalMachine.OpenSubKey(@"HARDWARE\DEVICEMAP\SERIALCOMM");
                    if (key != null) {
                        foreach (var name in key.GetValueNames()) {
                            if (name != null) {
                                var val = (string)key.GetValue(name);

                                if (val != null && val != string.Empty) {

                                    foreach (var p in serialports) {
                                        if (p.ToString().CompareTo(val) == 0)
                                            return val;
                                    }
                                }
                            }
                        }
                    }
                }

                catch {
                }
            }
            else {
                var ports = SerialPort.GetPortNames();

                if (ports != null) {
                    foreach (var port in ports) {
                        if (port.Contains("usbmodemDUE_SC131"))
                            return "/dev/tty.usbmodemDUE_SC131";
                        else if (port.Contains("usbmodemDUE_SC0071"))
                            return "/dev/tty.usbmodemDUE_SC0071";
                    }
                }
            }

            return string.Empty;
        }
        private void Connect(string comPort) {
            this.serialPort = new SerialInterface(comPort);
            this.serialPort.Connect();

            this.Version = this.serialPort.GetVersion().Substring(0);

            if (this.Version!= null && this.Version != string.Empty && this.Version.Length == 7 ) {

                this.DeviceConfig = new DeviceConfiguration();

                if (this.Version[this.Version.Length -1] == 'P') {
                    this.DeviceConfig.IsPulse = true;
                    this.DeviceConfig.MaxPinIO = 23;
                    this.DeviceConfig.MaxPinAnalog = 29;

                }
                else if (this.Version[this.Version.Length - 1] == 'I') {
                    this.DeviceConfig.IsPico = true;
                    this.DeviceConfig.MaxPinIO = 29;
                    this.DeviceConfig.MaxPinAnalog = 29;

                }
                else if (this.Version[this.Version.Length - 1] == 'F') {
                    this.DeviceConfig.IsFlea = true;
                    this.DeviceConfig.MaxPinIO = 11;
                    this.DeviceConfig.MaxPinAnalog = 29;

                }
                else if (this.Version[this.Version.Length - 1] == 'E') {
                    this.DeviceConfig.IsEdge = true;
                    this.DeviceConfig.MaxPinIO = 22;
                    this.DeviceConfig.MaxPinAnalog = 11;

                }
                else {
                    throw new Exception("Not support the version " + this.Version);
                }

                this.serialPort.DeviceConfig = this.DeviceConfig;
            }
            else {
                throw new Exception("The device is not supported.");
            }
        }

        public void Disconnect() => this.serialPort.Disconnect();   
    }
}
