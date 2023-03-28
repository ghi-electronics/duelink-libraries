class SoundController:
    def __init__(self, serialPort):
        self.serialPort = serialPort
        self.MaxFrequency = 1000000
        self.MinFrequency = 16

    def Play(self, frequency, duration_ms, volume):
        if frequency < self.MinFrequency or frequency > self.MaxFrequency:
            raise Exception("Frequency must be in range 16Hz..1000000Hz")

        if duration_ms > 99999999:
            raise Exception("duration_ms must be in range 0..99999999")

        if volume < 0 or volume > 100:
            raise Exception("volume must be in range 0..100")

        cmd = "sound({}, {}, {})".format(frequency, duration_ms, volume)

        self.serialPort.WriteLine(cmd)

        res = self.serialPort.ReadRespone()

        return res.success

    def Stop(self):
        frequency = 0
        duration_ms = 0
        volume = 0

        cmd = "sound({}, {}, {})".format(frequency, duration_ms, volume)

        self.serialPort.WriteLine(cmd)

        res = self.serialPort.ReadRespone()

        return res.success
