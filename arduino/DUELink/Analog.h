#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class AnalogController {

public:

    AnalogController(DUELinkTransport &transport) {
      m_pTransport = &transport;
    } 

    float VRead(int pin);
    void PWrite(int pin, float power);

private:
    DUELinkTransport *m_pTransport = NULL;

};
  
  
