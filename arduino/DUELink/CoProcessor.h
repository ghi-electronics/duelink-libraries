#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"
#include "DlStream.h"

class CoProcessorController
{
public:
    CoProcessorController(DUELinkTransport &transport,StreamController &stream)
    {
        m_pTransport = &transport;
        m_pStream = &stream;
    }

    bool Erase() {
        m_pTransport->WriteCommand("CoprocE()");
        DUELinkTransport::Response result = m_pTransport->ReadResponse();     
        return result.success;
    }

    bool Program() {
        // need Xmodem 1K, TODO        
        return false;
    }

    bool Reset() {
        m_pTransport->WriteCommand("CoprocS()");
        DUELinkTransport::Response result = m_pTransport->ReadResponse();     
        return result.success;
    }

#ifdef ARDUINO
        String Version() {
#else
        std::string Version() {
#endif    
        m_pTransport->WriteCommand("CoprocS()");
        DUELinkTransport::Response result = m_pTransport->ReadResponse();     
        return result.response;
    }

    int Write(const byte* dataWrite, int count) {

        char cmd[32];
        //declare b9 array
        sprintf(cmd, "dim b9[%d]", count);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();     

        //write data to b9
        int written = m_pStream->WriteBytes("b9", dataWrite, count);

        //write b9 to co-pro
        m_pTransport->WriteCommand("CoprocW(b9)");
        result = m_pTransport->ReadResponse();   

        if (result.success)
            return written;

        return 0;
    }

    int Read(byte* dataRead, int count) {

        char cmd[32];
        //declare b9 array
        sprintf(cmd, "dim b9[%d]", count);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();     

        //read data to b9
        m_pTransport->WriteCommand("CoprocR(b9)");
        result = m_pTransport->ReadResponse();   

        //read b9 by stream
        int read = m_pStream->ReadBytes("b9", dataRead, count);

        if (result.success)
            return read;

        return 0;
    }
    
private:
    DUELinkTransport *m_pTransport = NULL;
    StreamController *m_pStream = NULL;
};
