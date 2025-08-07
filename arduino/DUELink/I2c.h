#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class I2cController {
public:
    I2cController(DUELinkTransport &transport) {
        m_pTransport = &transport;
    } 

    bool Configuration(int speed) {
        char cmd[64];
        sprintf(cmd, "i2ccfg(%d)", speed);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        return result.success;
    }

    bool Write(uint8_t address, const char *data, int offset, int count) {
        return WriteRead(address, data, offset, count, NULL, 0, 0);
    }

    bool Read(uint8_t address, const char *data, int offset, int count) {
        return WriteRead(address, NULL, 0, 0, data, offset, count);
    }

    bool WriteRead(uint8_t address, const char *dataWrite, int offsetWrite, int countWrite, const char *dataRead, int offsetRead, int countRead) {
        if (!dataWrite && !dataRead) return false;
        if (!dataWrite && countWrite) return false;
        if (!dataRead && countRead) return false;

        String arr = build_bytearray(dataWrite, offsetWrite, countWrite);
        char *cmd = new char[32 + arr.length()];
        sprintf(cmd, "i2cwr(%d,%s,0)", address, arr.c_str());
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        delete []cmd;
        return result.success;
    }

private:
    DUELinkTransport *m_pTransport = NULL;
};
  
  
