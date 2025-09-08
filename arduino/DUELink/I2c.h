#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"
#include "DlStream.h"

class I2cController {
public:
    I2cController(DUELinkTransport &transport,StreamController &stream) {
        m_pTransport = &transport;
        m_pStream = &stream;
    } 

    bool Configuration(int speed) {
        char cmd[64];
        sprintf(cmd, "i2ccfg(%d)", speed);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        return result.success;
    }

    bool WriteRead(uint8_t address, const byte *dataWrite, int countWrite, byte *dataRead, int countRead) {
        if (!dataWrite && !dataRead) return false;
        if (!dataWrite && countWrite) return false;
        if (!dataRead && countRead) return false;
        
        char cmd[32];
        int written = 0;
        int read = 0;
        int offsetWrite = 0;
        int offsetRead = 0;
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

        // issue i2cwr cmd
        if (countWrite > 0 && countRead>0)            
            sprintf(cmd, "i2cwr(%d,b9,b8)", address);
        else if (countWrite > 0) {
            sprintf(cmd, "i2cwr(%d,b9,0)", address);
        }
        else {
            sprintf(cmd, "i2cwr(%d,0,b8)", address);
        }

        m_pTransport->WriteCommand(cmd);
        m_pTransport->ReadResponse(); 

        if (countRead > 0) {
            read = m_pStream->ReadBytes("b8",&dataRead[offsetRead],countRead);
        }

        return (written == countWrite) && (read == countRead);   
    }

private:
    DUELinkTransport *m_pTransport = NULL;
    StreamController *m_pStream = NULL;
};
  
  
