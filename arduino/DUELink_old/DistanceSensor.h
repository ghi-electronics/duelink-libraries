#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class DistanceSensorController
{
public:
    DistanceSensorController(DUELinkTransport &transport)
    {
        m_pTransport = &transport;
    }

    float Read(int pulsePin, int echoPin)
    {
        char cmd[32];
        sprintf(cmd, "dist(%d,%d)", pulsePin, echoPin);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        if (result.success)
            return atof(result.response.c_str());
        return 0;
    }
    
private:
    DUELinkTransport *m_pTransport = NULL;
};
