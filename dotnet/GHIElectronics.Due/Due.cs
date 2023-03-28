using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.Due {
    public partial class DueController
    {
        const int MAX_IO = 21;
        const int MAX_IO_ANALOG = 11;

        SerialInterface serialPort = default!;

        public AnalogController Analog { get; internal set; }
        public DigitalController Digital { get; internal set; }
        public I2cController I2c { get; internal set; }
        public ServoMotoController ServoMoto { get; internal set; }
        public SpiController Spi { get; internal set; }

        public FrequencyController Frequency  { get; internal set; }

        public InfraredController Infrared { get; internal set; }

        public NeoController Neo { get; internal set; }

        public PwmController PWM { get; internal set; }

        public SystemController System { get; internal set; }

        public UartController Uart { get; internal set; }
        public ButtonController Button { get; internal set; }
        public DistanceSensorController DistanceSensor { get; internal set; }
        public SoundController Sound { get; internal set; }
        public DisplayController Display { get; internal set; }

        public TouchController Touch { get; internal set; }

        public LedController Led { get; internal set; }

        public string Version { get; internal set; } = string.Empty;

        public DueController(string comPort) {
            if (comPort == null)
                throw new ArgumentNullException("Invalid comport");

            this.Connect(comPort);

            this.Analog = new AnalogController(this.serialPort);
            this.Digital = new DigitalController(this.serialPort);         
            this.I2c = new I2cController(this.serialPort);
            this.ServoMoto = new ServoMotoController(this.serialPort);
            this.Frequency = new FrequencyController(this.serialPort);
            this.Spi = new SpiController(this.serialPort);
            this.Infrared = new InfraredController(this.serialPort);
            this.Neo = new NeoController(this.serialPort);
            this.PWM = new PwmController(this.serialPort);
            this.System = new SystemController(this.serialPort);
            this.Uart = new UartController(this.serialPort);
            this.Button = new ButtonController(this.serialPort);
            this.DistanceSensor = new DistanceSensorController(this.serialPort);
            this.Sound = new SoundController(this.serialPort);
            this.Display = new DisplayController(this.serialPort);
            this.Touch = new TouchController(this.serialPort);
            this.Led = new LedController(this.serialPort);
        }
        public void Connect(string comPort) {
            this.serialPort = new SerialInterface(comPort);
            this.serialPort.Connect();

            this.Version = this.serialPort.GetVersion().Substring(0);
        }
        

        public void Disconnect() => this.serialPort.Disconnect();

    }
}
