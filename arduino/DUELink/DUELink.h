#pragma once


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
#include "Stream.h"
#include "CoProcessor.h"
#include "DistanceSensor.h"
#include "DMX.h"
#include "FileSystem.h"
#include "Temperature.h"
#include "Humidity.h"


class DUELink {
public:
    DUELink(DUELinkTransport &transport) :
    Stream(transport), Analog(transport), Button(transport), Digital(transport), Engine(transport),
    Frequency(transport), Graphics(transport), I2c(transport), Led(transport),
    Sound(transport), System(transport), CoProcessor(transport,Stream), DistanceSensor(transport),
    DMX(transport,Stream), FileSystem(transport,Stream),Humidity(transport), Temperature(transport ){
        m_pTransport = &transport;
    }
    
    bool Connect() {
        
        m_pTransport->begin();
        m_pTransport->sync();
        
        return 1;
    }

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
    CoProcessorController CoProcessor;
    DistanceSensorController DistanceSensor;
    DMXController DMX;
    FileSystemController FileSystem;
    TemperatureController Temperature;
    HumidityController Humidity;

    void SetTimeout(int timeout_ms) {
        m_pTransport->ReadTimeout = timeout_ms;
    }

    int GetTimeout() {
        return m_pTransport->ReadTimeout;
    }




private:
    DUELinkTransport *m_pTransport = NULL;
};