#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"
#include "DlStream.h"

class DMXController
{
public:
    DMXController(DUELinkTransport &transport,StreamController &stream)
    {
        m_pTransport = &transport;
        m_pStream = &stream;
        
    }

    bool Write(const byte* channel_data, int count)
    {
        char cmd[32];

        //declare b9 array
        sprintf(cmd, "dim b9[%d]", count);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        //write data to b9
        int written = m_pStream->WriteBytes("b9", channel_data, count);

        //write b9 to dmx
        m_pTransport->WriteCommand("DmxW(b9)");
        result = m_pTransport->ReadResponse();   

        return result.success;
    }

    int Read(int channel)
    {
        char cmd[32];
        sprintf(cmd, "DmxR(%d)", channel);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        if (result.success)
            return atoi(result.response.c_str());
        return 0;
    }

    bool Ready()
    {        
        m_pTransport->WriteCommand("DmxRdy()");
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        if (result.success)
            return atoi(result.response.c_str()) > 0;
        return false;
    }

    bool Update()
    {        
        m_pTransport->WriteCommand("DmxU()");
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        return result.success;
    }

    

private:
    DUELinkTransport *m_pTransport = NULL;
    StreamController *m_pStream = NULL;
    
    
};
