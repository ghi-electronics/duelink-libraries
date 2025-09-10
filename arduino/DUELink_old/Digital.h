#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class DigitalController
{

public:
    DigitalController(DUELinkTransport &transport)
    {
        m_pTransport = &transport;
    }

    bool Read(int pin, int pull)
    {
        char cmd[32];
        sprintf(cmd, "dread(%d,%d)", pin, pull);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        if (result.success)
            return atoi(result.response.c_str());
        return false;
    }

    bool Write(int pin, int state)
    {
        char cmd[32];
        sprintf(cmd, "dwrite(%d,%d)", pin, state);
        m_pTransport->WriteCommand(cmd);
        
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        return result.success;
    }

private:
    DUELinkTransport *m_pTransport = NULL;
};
