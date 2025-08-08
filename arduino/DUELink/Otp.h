#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"
#include "DlStream.h"

class OtpController
{
public:
    OtpController(DUELinkTransport &transport,StreamController &stream)
    {
        m_pTransport = &transport;
        m_pStream = &stream;
        
    }

    bool Write(int address, const byte* data, int count)
    {
        char cmd[32];

        //declare b9 array
        sprintf(cmd, "dim b9[%d]", count);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        //write data to b9
        int written = m_pStream->WriteBytes("b9", data, count);

        //write b9 to otp
        sprintf(cmd, "OtpW(%d,b9)", address);
        m_pTransport->WriteCommand(cmd);
        result = m_pTransport->ReadResponse();   

        return result.success;
    }

    int Read(int address)
    {
        char cmd[32];
        sprintf(cmd, "OtpR(%d)", address);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        if (result.success)
            return atoi(result.response.c_str());
        return 0;
    }

private:
    DUELinkTransport *m_pTransport = NULL;
    StreamController *m_pStream = NULL;
    
    
};
