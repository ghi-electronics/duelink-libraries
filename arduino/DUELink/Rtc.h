#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"
#include "DlStream.h"

class RtcController
{
public:
    RtcController(DUELinkTransport &transport,StreamController &stream)
    {
        m_pTransport = &transport;
        m_pStream = &stream;
        
    }

    bool Write(const byte* data, int count)
    {
        char cmd[32];

        //declare b9 array
        sprintf(cmd, "dim b9[%d]", count);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        //write data to b9
        int written = m_pStream->WriteBytes("b9", data, count);

        //write b9 to rtc        
        m_pTransport->WriteCommand("RtcW(b9)");
        result = m_pTransport->ReadResponse();   

        return result.success;
    }

    int Read(byte* data, int count) {

        char cmd[32];
        //declare b9 array
        sprintf(cmd, "dim b9[%d]", count);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();     

        //read data to b9
        m_pTransport->WriteCommand("RtcR(b9)");
        result = m_pTransport->ReadResponse();   

        //read b9 by stream
        int read = m_pStream->ReadBytes("b9", data, count);

        if (result.success)
            return read;

        return 0;
    }

private:
    DUELinkTransport *m_pTransport = NULL;
    StreamController *m_pStream = NULL;
    
    
};
