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
        DUELinkTransport::Response result = m_pTransport->execute(cmd);
        if (result.success)
            return atoi(result.result.c_str());
        return false;
    }

    void Write(int pin, int state)
    {
        char cmd[32];
        sprintf(cmd, "dwrite(%d,%d)", pin, state);
        m_pTransport->execute(cmd);
    }

private:
    DUELinkTransport *m_pTransport = NULL;
};
