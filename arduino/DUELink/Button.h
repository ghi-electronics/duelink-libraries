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

    void Enable(int pin, int state) {
      char cmd[64];
      sprintf(cmd, "btnen(%d,%d)", pin, state);
      m_pTransport->execute(cmd);  
    }

    bool Up(int pin){
        char cmd[32];
        sprintf(cmd, "btnup(%d)", pin); 
        DUELinkTransport::Response result = m_pTransport->execute(cmd);  
        if (result.success) return result.result[0] == '1';
        return false;
    }

    bool Down(int pin){
        char cmd[32];
        sprintf(cmd, "btndown(%d)", pin); 
        DUELinkTransport::Response result = m_pTransport->execute(cmd);  
        if (result.success) return result.result[0] == '1';
        return false;
    }     
private:
    DUELinkTransport *m_pTransport = NULL;
    DigitalController m_digital;
    int m_mode = -1;
};
  