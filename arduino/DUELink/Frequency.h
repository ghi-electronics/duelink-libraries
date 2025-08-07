#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class FrequencyController {
public:
    FrequencyController(DUELinkTransport &transport) {
        m_pTransport = &transport;
    } 

    bool Write(int pin, int frequency, int duration_ms, float duty) {
        char cmd[128];
        sprintf(cmd, "freq(%d,%d,%d,%g)", pin, frequency, duration_ms, duty);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();

        return result.success;
    }

private:
    DUELinkTransport *m_pTransport = NULL;

};
  
  
