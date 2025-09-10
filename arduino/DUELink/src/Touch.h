#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class TouchController
{

public:
    TouchController(DUELinkTransport &transport)
    {
        m_pTransport = &transport;
    }

    int Read(int pin, int charge_time, int charge_state, int timeout)
    {
        char cmd[32];
        sprintf(cmd, "touch(%d,%d,%d,%d)", pin, charge_time,charge_state, timeout);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        if (result.success)
            return atoi(result.response.c_str());
        return 0;
    }

private:
    DUELinkTransport *m_pTransport = NULL;
};
