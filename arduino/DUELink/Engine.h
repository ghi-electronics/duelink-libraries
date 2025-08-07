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

    bool Run() {
      m_pTransport->WriteCommand("run");
      DUELinkTransport::Response result = m_pTransport->ReadResponse();
      return result.success;
    }

    bool Select(int num) {
      char cmd[32];
      sprintf(cmd, "sel(%d)", num);
      m_pTransport->WriteCommand(cmd);
      DUELinkTransport::Response result = m_pTransport->ReadResponse();

      return result.success;
    }

    bool WriteCommand(char* cmd) {
      m_pTransport->WriteCommand(cmd);
      DUELinkTransport::Response result = m_pTransport->ReadResponse();

      return result.success;
    }



private:
    DUELinkTransport *m_pTransport = NULL;

};
  
  
