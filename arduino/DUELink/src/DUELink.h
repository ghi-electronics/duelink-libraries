#pragma once

#ifndef __DUELINK_HEADER
#define __DUELINK_HEADER

#include "DUELinkTransport.h"
#include "System.h"
#include "Led.h"
#include "Digital.h"
#include "Analog.h"
#include "Button.h"
#include "Engine.h"
#include "Frequency.h"
#include "I2c.h"
#include "Sound.h"
#include "Graphics.h"
#include "DlStream.h"
#include "DistanceSensor.h"
#include "DMX.h"
#include "FileSystem.h"
#include "Temperature.h"
#include "Humidity.h"
#include "Infrared.h"
#include "Otp.h"
#include "Pulse.h"
#include "Rtc.h"
#include "Servo.h"
#include "Spi.h"
#include "Touch.h"
#include "Uart.h"


class DUELink {
public:
    DUELink(DUELinkTransport &transport) :
    Stream(transport), Analog(transport), Button(transport), Digital(transport), Engine(transport),
    Frequency(transport), Graphics(transport,Stream), I2c(transport,Stream), Led(transport),
    Sound(transport,Stream), System(transport), Distance(transport),
    DMX(transport,Stream), FileSystem(transport,Stream),Humidity(transport), Temperature(transport ),
    Infrared(transport), Otp(transport,Stream), Pulse(transport),Rtc(transport,Stream),Servo(transport),
    Spi(transport,Stream),Touch(transport),Uart(transport,Stream)
    {
        m_pTransport = &transport;
    }
    
    bool Connect();

    AnalogController Analog;
    ButtonController Button;
    DigitalController Digital;
    EngineController Engine;
    FrequencyController Frequency;
    GraphicsController Graphics;
    I2cController I2c;
    LedController Led;
    SoundController Sound;
    SystemController System;
    StreamController Stream;    
    DistanceSensorController Distance;
    DMXController DMX;
    FileSystemController FileSystem;
    TemperatureController Temperature;
    HumidityController Humidity;
    InfraredController Infrared;
    OtpController Otp;
    PulseController Pulse;
    RtcController Rtc;
    ServoController Servo;
    SpiController Spi;
    TouchController Touch;
    UartController Uart;

    void SetTimeout(int timeout_ms);

    int GetTimeout();




private:
    DUELinkTransport *m_pTransport = NULL;
};

#endif