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
        DUELinkTransport::Response result = m_pTransport->execute(cmd);
        if (result.success)
            return atof(result.result.c_str());
        return 0;
    }

    void PWrite(int pin, float power)
    {
        char cmd[32];
        sprintf(cmd, "pwrite(%d,%g)", pin, power);
        m_pTransport->execute(cmd);
    }

private:
    DUELinkTransport *m_pTransport = NULL;
};
