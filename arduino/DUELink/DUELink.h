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

class DUELink {
public:
    DUELink(DUELinkTransport &transport) :
    Analog(transport), Button(transport), Digital(transport), Engine(transport),
    Frequency(transport), Graphics(transport), I2c(transport), Led(transport),
    Sound(transport), System(transport) {
        m_pTransport = &transport;
    }
    
    bool Connect() {
        char escseq[] = {0x1b, 0};  
        m_pTransport->begin();
        m_pTransport->sync();
        m_pTransport->execute(">");
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

private:
    DUELinkTransport *m_pTransport = NULL;
};