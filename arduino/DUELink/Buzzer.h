#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class BuzzerController {

public:

    BuzzerController(DUELinkTransport &transport) {
      m_pTransport = &transport;
    } 

    void PlayBeep(int freq, int duration);
    void PlaySound(int freq, int duration, float dc);  
    void PlayMelody(float *data, int count);
    void StopMelody();
private:
    DUELinkTransport *m_pTransport = NULL;

};
  