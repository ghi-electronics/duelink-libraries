#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class ServoController
{

public:
    ServoController(DUELinkTransport &transport)
    {
        m_pTransport = &transport;
    }

    int Set(int pin, int position)
    {
        char cmd[32];
        sprintf(cmd, "servost(%d,%d)", pin, position);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        return result.success;
    }

private:
    DUELinkTransport *m_pTransport = NULL;
};
