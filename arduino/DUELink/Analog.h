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

    float VoltRead(int pin)
    {
        char cmd[32];
        sprintf(cmd, "vread(%d)", pin);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        if (result.success)
            return atof(result.response.c_str());
        return 0;
    }
    
    float Read(int pin)
    {
        char cmd[32];
        sprintf(cmd, "aread(%d)", pin);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        if (result.success)
            return atof(result.response.c_str());
        return 0;
    }

    bool Write(int pin, float power)
    {
        char cmd[32];
        sprintf(cmd, "awrite(%d,%g)", pin, power);
        m_pTransport->WriteCommand(cmd);

        DUELinkTransport::Response result = m_pTransport->ReadResponse();

        return result.success;
    }

    float ReadVCC()
    {       
        m_pTransport->WriteCommand("ReadVCC()");
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        if (result.success)
            return atof(result.response.c_str());
        return 0;
    }

private:
    DUELinkTransport *m_pTransport = NULL;
};
