class DeviceConfiguration:
    def __init__(self):
        self.IsPulse = False
        self.IsFlea = False
        self.IsPico = False
        self.IsEdge = False
        self.IsRave = False
        self.IsTick = False
        self.IsDue = False
        self.MaxPinIO = 27
        self.MaxPinAnalog = 0
        self.PWMPins = {1, 2, 3, 4, 5, 6, 7, 8, 11}
        self.InterruptPins = {1, 2, 3, 4, 5, 6, 7, 12}
        self.AnalogPins = {1, 2, 3, 4, 5, 6, 7, 8, 9, 17}

