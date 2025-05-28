#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "ButtonL.h"

void ButtonLController::Init(int mode) {
  m_mode = mode;
  
  if (m_mode) {
    m_pTransport->execute("btnen(1,0,0)");  
  } else {
    m_pTransport->execute("btnen(1,1,1)");  
  }
}

bool ButtonLController::IsPressed(){
  if (m_mode) {
    return !m_digital.Read(1, 1);
  }
  
  DUELinkTransport::Response result = m_pTransport->execute("btndown(1)");  
  if (result.success) return atoi(result.result.c_str());
  return false;
}

bool ButtonLController::IsReleased(){
  if (m_mode) {
    return m_digital.Read(1, 1);
  }
  
  DUELinkTransport::Response result = m_pTransport->execute("btnup(1)");
  if (result.success) return atoi(result.result.c_str());
  return false;
}

  
  
  
  
