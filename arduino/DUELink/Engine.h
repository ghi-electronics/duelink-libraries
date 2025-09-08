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

    bool Record(const char *script, int region) {
        DUELinkTransport::Response result;
      if (region == 0) {
        m_pTransport->WriteCommand("new all");
        result = m_pTransport->ReadResponse();
        
        if (!result.success)
            return false;
      }
      else if (region == 1) {
        m_pTransport->WriteCommand("Region(1)");
        result = m_pTransport->ReadResponse();
        
        if (!result.success)
            return false;
        
        m_pTransport->WriteCommand("new");
        result = m_pTransport->ReadResponse();
        
        if (!result.success)
            return false;
          
      }
      else  {
          return false;   
      }
      
      byte* data = new byte[strlen(script) + 1];
      
      memcpy(data, script, strlen(script));
      
      data[strlen(script)] = 0;// stop the stream
      
      m_pTransport->WriteCommand("pgmbrst()");
        result = m_pTransport->ReadResponse();
        
        if (!result.success)
            return false;
        
        m_pTransport->WriteRawData((const byte*)data, 0 , strlen(script));
        result = m_pTransport->ReadResponse();
        
        return result.success;
      
    }
  
    bool Select(int num) {
      char cmd[32];
      sprintf(cmd, "sel(%d)", num);
      m_pTransport->WriteCommand(cmd);
      DUELinkTransport::Response result = m_pTransport->ReadResponse();

      return result.success;
    }

    float ExecuteCommand(const char* cmd) {
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();

        if (result.success)
            return atof(result.response.c_str());
        return 0;
    }

#ifdef ARDUINO
    String ExecuteCommandRaw(const char* cmd) 
#else
    std::string ExecuteCommandRaw(const char* cmd) 
#endif        
    {
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();

        return result.response.c_str();
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
  
  
