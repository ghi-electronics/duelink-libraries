#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class HumidityController
{
public:
    HumidityController(DUELinkTransport &transport)
    {
        m_pTransport = &transport;
    }

    float Read(int pin, int type)
    {
        char cmd[32];
        sprintf(cmd, "humid(%d,%d)", pin,type);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        if (result.success)
            return atof(result.response.c_str());
        return 0;
    }
    

private:
    DUELinkTransport *m_pTransport = NULL;
};
