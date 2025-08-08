#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"
#include "Stream.h"

class SpiController {
public:
    SpiController(DUELinkTransport &transport,StreamController &stream) {
        m_pTransport = &transport;
        m_pStream = &stream;
    } 

    bool Configuration(int mode, int frequencyKHz) {
        char cmd[64];
        sprintf(cmd, "spicfg(%d,%d)", mode,frequencyKHz);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        return result.success;
    }

    bool WriteRead(uint8_t address, const byte *dataWrite, int offsetWrite, int countWrite, byte *dataRead, int offsetRead, int countRead) {
        if (!dataWrite && !dataRead) return false;
        if (!dataWrite && countWrite) return false;
        if (!dataRead && countRead) return false;
        
        char cmd[32];
        int written = 0;
        int read = 0;
        if (countWrite > 0) {
            // declare b9 to write
            sprintf(cmd, "dim b9[%d]", countWrite);
            m_pTransport->WriteCommand(cmd);
            m_pTransport->ReadResponse();     
        }
        if (countRead > 0) {
            // declare b8 to read
            sprintf(cmd, "dim b8[%d]", countRead);
            m_pTransport->WriteCommand(cmd);
            m_pTransport->ReadResponse();     
        }

        if (countWrite > 0) {
            // write data to b9 by stream
            written = m_pStream->WriteBytes("b9",&dataWrite[offsetWrite],countWrite);
        }

        // issue spiwrs cmd
        if (countWrite > 0 && countRead>0)            
            sprintf(cmd, "spiwrs(b9,b8)");
        else if (countWrite > 0) {
            sprintf(cmd, "spiwrs(b9,0)");
        }
        else {
            sprintf(cmd, "spiwrs(0,b8)");
        }

        m_pTransport->WriteCommand(cmd);
        m_pTransport->ReadResponse(); 

        if (countRead > 0) {
            read = m_pStream->ReadBytes("b8",&dataRead[offsetRead],countRead);
        }

        return (written == countWrite) && (read == countRead);   
    }

    int WriteByte(byte b) {
        char cmd[32];
        sprintf(cmd, "spiwr(%d)", b);

        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        if (result.success)
            return atoi(result.response.c_str());

        return -1;
    }

private:
    DUELinkTransport *m_pTransport = NULL;
    StreamController *m_pStream = NULL;
};
  
  
