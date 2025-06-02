#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class EngineController {
public:
    EngineController(DUELinkTransport &transport) {
        m_pTransport = &transport;
    } 

    bool Record(const char *script) {
      return false;    
    }

    bool Run(const char *script) {
      DUELinkTransport::Response result = m_pTransport->execute(script);
      return result.success;
    }

    void Select(int num) {
      char cmd[32];
      sprintf(cmd, "sel(%d)", num);
      m_pTransport->execute(cmd);
    }

private:
    DUELinkTransport *m_pTransport = NULL;

};
  
  
