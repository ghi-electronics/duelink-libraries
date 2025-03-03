
using System.Collections;
using System.Diagnostics;
using System.IO.Ports;
using System.Reflection.Metadata.Ecma335;
using System.Runtime.InteropServices;
using Microsoft.Win32;

namespace GHIElectronics.DUELink {

    public class DeviceConfiguration {
        public uint MaxPinIO { get;  } = 27;
        public uint MaxPinAnalog { get;  } = 10;

        public int[] PWMPins = new int[] { 1, 2, 3, 4, 5, 6, 7, 8, 11 };
        public int[] InterruptPins = new int[] { 1, 2, 3, 4, 5, 6, 7, 12 };
        public int[] AnalogPins = new int[] { 1, 2, 3, 4, 5, 6, 7, 8, 9, 17 };
    }
    public partial class DUELinkController {


        SerialInterface serialPort = default!;

        public int TransferBlockDelay {
            get => this.serialPort.TransferBlockDelay;
            set => this.serialPort.TransferBlockDelay = value;
        }

        public int TransferBlockSizeMax {
            get => this.serialPort.TransferBlockSizeMax;
            set => this.serialPort.TransferBlockSizeMax = value;
        }

        public DeviceConfiguration DeviceConfig { get; set; }

        public AnalogController Analog { get; internal set; }
        public DigitalController Digital { get; internal set; }
        public I2cController I2c { get; internal set; }
        public ServoController Servo { get; internal set; }
        public SpiController Spi { get; internal set; }

        public FrequencyController Frequency { get; internal set; }

        public InfraredController Infrared { get; internal set; }



        public SystemController System { get; internal set; }

        public UartController Uart { get; internal set; }
        public ButtonController Button { get; internal set; }
        public DistanceSensorController Distance { get; internal set; }
        public GraphicsController Graphics { get; internal set; }

        public TouchController Touch { get; internal set; }

        public LedController Led { get; internal set; }

        public EngineController Script { get; internal set; }



        public TemperatureController Temperature { get; internal set; }

        public HumidityController Humidity { get; internal set; }

        public PulseController Pulse { get; internal set; }

        public SoundController Sound { get; internal set; }
      

       

        public int MaxIO { get; internal set; }
        public int MaxAnalog { get; internal set; }

        public DUELinkController(string comPort) {
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
            this.Servo = new ServoController(this.serialPort);
            this.Frequency = new FrequencyController(this.serialPort);
            this.Spi = new SpiController(this.serialPort);
            this.Infrared = new InfraredController(this.serialPort);
 
            this.Uart = new UartController(this.serialPort);
            this.Button = new ButtonController(this.serialPort);
            this.Distance = new DistanceSensorController(this.serialPort);
            this.Graphics = new GraphicsController(this.serialPort);
            this.Touch = new TouchController(this.serialPort);
            this.Led = new LedController(this.serialPort);
            this.Script = new EngineController(this.serialPort);

            this.Temperature = new TemperatureController(this.serialPort);
            this.Humidity = new HumidityController(this.serialPort);
            this.System = new SystemController(this.serialPort);

            this.Pulse = new PulseController(this.serialPort);

            this.Sound = new SoundController(this.serialPort);
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

                                        if (devFnKey.Name.IndexOf(vid, StringComparison.InvariantCultureIgnoreCase) >= 0) {

                                            if (devFnKey.Name.IndexOf(pid, StringComparison.InvariantCultureIgnoreCase) >= 0) {
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

                    // MACOS
                    foreach (var port in ports) {
                        if (port.Contains("usbmodemDUE_SC131"))
                            return "/dev/tty.usbmodemDUE_SC131";
                        else if (port.Contains("usbmodemDUE_SC0071"))
                            return "/dev/tty.usbmodemDUE_SC0071";
                    }

                    // Linux
                    //var processInfo = new ProcessStartInfo("/usr/sbin/ghiusbports.sh") {
                    //    RedirectStandardOutput = true,
                    //};

                    //var p = Process.Start(processInfo);

                    //Thread.Sleep(300);

                    //var outputs = p.StandardOutput.ReadToEnd().Split("\n");
                    //foreach (var output in outputs) {
                    //    if (output.Contains("GHI_Electronics"))
                    //        return output.Split(" ")[0];
                    //}

                }
            }

            return string.Empty;
        }
        private void Connect(string comPort) {
            this.serialPort = new SerialInterface(comPort);
            this.serialPort.Connect();

            this.DeviceConfig = new DeviceConfiguration();
            this.serialPort.DeviceConfig = this.DeviceConfig;


            
        }

        public void Disconnect() => this.serialPort.Disconnect();


    }
}
