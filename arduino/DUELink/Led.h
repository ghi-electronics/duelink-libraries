#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class LedController
{

public:
    LedController(DUELinkTransport &transport)
    {
        m_pTransport = &transport;
    }

    void Set(int high, int low, int count)
    {
        char cmd[32];
        sprintf(cmd, "statled(%d,%d,%d)", high, low, count);
        m_pTransport->WriteCommand(cmd);
    }

private:
    DUELinkTransport *m_pTransport = NULL;
};
