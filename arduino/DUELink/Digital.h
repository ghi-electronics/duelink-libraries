#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class DigitalController {

public:

    DigitalController(DUELinkTransport &transport) {
      m_pTransport = &transport;
    } 

    bool Read(int pin, int pull);
    void Write(int pin, int state);

private:
    DUELinkTransport *m_pTransport = NULL;

};
