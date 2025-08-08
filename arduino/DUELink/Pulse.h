#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class PulseController
{

public:
    PulseController(DUELinkTransport &transport)
    {
        m_pTransport = &transport;
    }

    int Read(int pin, int state, int timeout_ms)
    {
        char cmd[32];
        sprintf(cmd, "PulseIn(%d,%d,%d)", pin, state,timeout_ms);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        if (result.success)
            return atoi(result.response.c_str());
        return false;
    }

private:
    DUELinkTransport *m_pTransport = NULL;
};
