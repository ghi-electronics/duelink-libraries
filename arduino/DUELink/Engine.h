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

    bool Run() {
      m_pTransport->WriteCommand("run");
      DUELinkTransport::Response result = m_pTransport->ReadResponse();
      return result.success;
    }

    bool Stop() {
      byte rawdata[1] = {27};

      m_pTransport->DiscardInBuffer();
      m_pTransport->WriteRawData(rawdata, 0, 1);
      
      DUELinkTransport::Response result = m_pTransport->ReadResponse();
      
      return result.success;
    }

    bool Record(const char *script) {
      //TODO
      return false;    
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

#ifdef ARDUINO
      String Read()
#else
      std::string Read()
#endif
    {
      //TODO
      return "";
    }



private:
    DUELinkTransport *m_pTransport = NULL;

};
  
  
