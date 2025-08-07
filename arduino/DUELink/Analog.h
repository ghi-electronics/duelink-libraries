#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class AnalogController
{
public:
    AnalogController(DUELinkTransport &transport)
    {
        m_pTransport = &transport;
    }

    float VRead(int pin)
    {
        char cmd[32];
        sprintf(cmd, "vread(%d)", pin);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        if (result.success)
            return atof(result.response.c_str());
        return 0;
    }

    bool PWrite(int pin, float power)
    {
        char cmd[32];
        sprintf(cmd, "pwrite(%d,%g)", pin, power);
        m_pTransport->WriteCommand(cmd);

        DUELinkTransport::Response result = m_pTransport->ReadResponse();

        return result.success;
    }

private:
    DUELinkTransport *m_pTransport = NULL;
};
