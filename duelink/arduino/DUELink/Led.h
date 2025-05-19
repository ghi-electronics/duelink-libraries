#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class LedController {

public:

    LedController(DUELinkTransport &transport) {
      m_pTransport = &transport;
    } 

    void Set(int high, int low, int count);  

private:
    DUELinkTransport *m_pTransport = NULL;

};
  
  
