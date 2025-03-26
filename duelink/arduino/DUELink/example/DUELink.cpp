#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELink.h"


DUELink::DUELink(DUELinkTransport &transport) : Led(transport) {
 
  m_pTransport = &transport;
 

  
}

bool DUELink::Connect() {
   char escseq[] = {0x1b, 0};  
  m_pTransport->begin();
  m_pTransport->execute(escseq);
  m_pTransport->execute(escseq);
  m_pTransport->execute(">");
}




/*
void DUELink::begin(DUELinkTransport &transport) {
    char escseq[] = {0x1b, 0};

    m_pTransport = &transport;
    m_pTransport->begin();
    m_pTransport->execute(escseq);
    m_pTransport->execute(escseq);
    m_pTransport->execute(">");
    //echo(0);

    //Led(transport);
  }
  
  
  

  
  bool DUELink::dread(int pin, int pull) {
    // char cmd[32];
    // sprintf(cmd, "dread(%d,%d)", pin, pull);
    // Response result = execute(cmd);
    // if (result.success) return atoi(result.result.c_str());
    return false;
  }
  
  void DUELink::dwrite(int pin, int state) {
    // char cmd[32];
    // sprintf(cmd, "dwrite(%d,%d)", pin, state);
    // execute(cmd);
  }
  */
  
  
