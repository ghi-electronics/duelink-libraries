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

class DUELink {
public:
    DUELink(DUELinkTransport &transport) :
    Analog(transport), Button(transport), Digital(transport), Engine(transport),
    Frequency(transport), Graphics(transport), I2c(transport), Led(transport),
    Sound(transport), System(transport), Stream(transport) {
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

    void SetTimeout(int timeout_ms) {
        m_pTransport->ReadTimeout = timeout_ms;
    }

    int GetTimeout() {
        return m_pTransport->ReadTimeout;
    }




private:
    DUELinkTransport *m_pTransport = NULL;
};