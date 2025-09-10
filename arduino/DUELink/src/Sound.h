#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class SoundController {
public:
    SoundController(DUELinkTransport &transport,StreamController &stream) {
        m_pTransport = &transport;
        m_pStream = &stream;
    } 

    bool Beep(int pin, int frequency, int duration_ms) {
        char cmd[64];
        sprintf(cmd, "beep(%d,%d,%d)", pin, frequency, duration_ms);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        return result.success;
    }

    bool MelodyPlay(int pin, const float *notes, int count) {
#ifdef ARDUINO
    String s;
#else
    std::string s;
#endif        
        // const char *arr;
        // int extraBytes;

        // if (count < 0) {
            // arr = (const char *)notes;
            // extraBytes = strlen(arr)+1;
        // } else {
            // s = build_floatarray((float*)notes, 0, count);
            // arr = s.c_str();
            // extraBytes = s.length()+1;
        // }
        // char *cmd = new char[32+extraBytes];
        // sprintf(cmd, "melodyp(%d,%s)", pin, arr);
        
        char cmd[32];

        //declare a9 array
        sprintf(cmd, "dim a9[%d]", count);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        //write notes to a9
        int written = m_pStream->WriteFloats("a9", notes, count);
        
        sprintf(cmd, "melodyp(%d,a9)", pin);               
        m_pTransport->WriteCommand(cmd);
        result = m_pTransport->ReadResponse();
        
        return result.success;
    }

    bool MelodyStop(int pin) {
        char cmd[32];
        sprintf(cmd, "melodys(%d)", pin);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();     
        return result.success;
    }

private:
    DUELinkTransport *m_pTransport = NULL;
    StreamController *m_pStream = NULL;

};
  
  
