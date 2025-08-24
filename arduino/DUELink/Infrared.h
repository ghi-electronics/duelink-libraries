#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class InfraredController
{
public:
    InfraredController(DUELinkTransport &transport)
    {
        m_pTransport = &transport;
    }

    int Read(int pin)
    {
        m_pTransport->WriteCommand("irread()");
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        if (result.success)
            return atoi(result.response.c_str());
        return -1;
    }

    bool Write(byte data)
    {
        char cmd[32];
        sprintf(cmd, "IrWrite(%d)", data);
        m_pTransport->WriteCommand(cmd);

        DUELinkTransport::Response result = m_pTransport->ReadResponse();

        return result.success;
    }

    bool Enable(int txpin, int rxpin) 
    {       
        char cmd[32];
        sprintf(cmd, "iren(%d,%d)", txpin,rxpin);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
       
         return result.success;
    }

private:
    DUELinkTransport *m_pTransport = NULL;
};
