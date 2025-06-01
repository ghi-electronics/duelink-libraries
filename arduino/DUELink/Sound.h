#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class SoundController {
public:
    SoundController(DUELinkTransport &transport) {
        m_pTransport = &transport;
    } 

    bool Beep(int pin, int frequency, int duration_ms) {
        char cmd[64];
        sprintf(cmd, "beep(%d,%d,%d)", pin, frequency, duration_ms);
        DUELinkTransport::Response result = m_pTransport->execute(cmd);
        return result.success;
    }

    bool MelodyPlay(int pin, const void *notes, int count) {
        String s;
        const char *arr;
        int extraBytes;

        if (count < 0) {
            arr = (const char *)notes;
            extraBytes = strlen(arr)+1;
        } else {
            s = build_floatarray((float*)notes, 0, count);
            arr = s.c_str();
            extraBytes = s.length()+1;
        }
        char *cmd = new char[32+extraBytes];
        sprintf(cmd, "melodyp(%d,%s)", pin, arr);
        DUELinkTransport::Response result = m_pTransport->execute(cmd);
        delete []cmd;
        return result.success;
    }

    bool MelodyStop(int pin) {
        char cmd[32];
        sprintf(cmd, "melodys(%d)", pin);
        DUELinkTransport::Response result = m_pTransport->execute(cmd);        
        return result.success;
    }

private:
    DUELinkTransport *m_pTransport = NULL;

};
  
  
