#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"
#include "DlStream.h"

class UartController {
public:
    UartController(DUELinkTransport &transport,StreamController &stream) {
        m_pTransport = &transport;
        m_pStream = &stream;
    } 

    bool Configuration(int baurdate, int rx_buffer_size) {
        char cmd[64];
        sprintf(cmd, "SerCfg(%d,%d)", baurdate,rx_buffer_size);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        return result.success;
    }

    bool WriteByte(byte b) {
        char cmd[32];
        sprintf(cmd, "SerWr(%d)", b);

        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();

        return result.success;
    }

    int WriteBytes(const byte* data, int count)
    {
        char cmd[32];

        //declare b9 array
        sprintf(cmd, "dim b9[%d]", count);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        //write data to b9
        int written = m_pStream->WriteBytes("b9", data, count);

        //write b9 to otp
        sprintf(cmd, "SerWrs(b9)");
        m_pTransport->WriteCommand(cmd);
        result = m_pTransport->ReadResponse();   

        if (result.success)
            return written;
        return 0;
    }

    int ReadByte()
    {        
        m_pTransport->WriteCommand("SerRd()");
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        if (result.success)
            return atoi(result.response.c_str());
        return 0;
    }

    int ReadBytes(byte* data, int count, int timeout) {

        char cmd[32];
        //declare b9 array
        sprintf(cmd, "dim b9[%d]", count);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();     

        //read data to b9
        sprintf(cmd, "SerRds(b9,%d)", timeout);
        m_pTransport->WriteCommand("CoprocR(b9)");
        result = m_pTransport->ReadResponse();   

        //read b9 by stream
        int read = m_pStream->ReadBytes("b9", data, count);

        if (result.success)
            return read;

        return 0;
    }

    int BytesToRead()
    {        
        m_pTransport->WriteCommand("SerB2R()");
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        if (result.success)
            return atoi(result.response.c_str());
        return 0;
    }

    bool Discard()
    {        
        m_pTransport->WriteCommand("SerDisc()");
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        return result.success;
    }

    

private:
    DUELinkTransport *m_pTransport = NULL;
    StreamController *m_pStream = NULL;
};
  
  
