#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"
#include "Digital.h"

class ButtonLController {
public:
    ButtonLController(DUELinkTransport &transport) : m_digital(transport) {
      m_pTransport = &transport;
    } 
    void Init(int mode);
    bool IsPressed();
    bool IsReleased();      
private:
    DUELinkTransport *m_pTransport = NULL;
    DigitalController m_digital;
    int m_mode = -1;
};
  