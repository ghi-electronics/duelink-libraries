#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"
#include "Digital.h"

class ButtonController {
public:
    ButtonController(DUELinkTransport &transport) : m_digital(transport) {
         m_pTransport = &transport;
    } 

    void Enable(int pin, int state, int pull) {
        char cmd[64];
        sprintf(cmd, "btnen(%d,%d,%d)", pin, state,pull);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();  
    }

    bool Up(int pin){
        char cmd[32];
        sprintf(cmd, "btnup(%d)", pin); 
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        if (result.success) 
            return result.response[0] == '1';
        return false;
    }

    bool Down(int pin){
        char cmd[32];
        sprintf(cmd, "btndown(%d)", pin); 
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        if (result.success) 
            return result.response[0] == '1';
        return false;
    }     
private:
    DUELinkTransport *m_pTransport = NULL;
    DigitalController m_digital;
    int m_mode = -1;
};
  