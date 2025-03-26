#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "analog.h"


float AnalogController::VRead(int pin) {
  char cmd[32];
  sprintf(cmd, "vread(%d)", pin);
  DUELinkTransport::Response result = m_pTransport->execute(cmd);
  if (result.success) return atof(result.result.c_str());
  return 0;
}
void AnalogController::PWrite(int pin, float power){
  char cmd[32];
  sprintf(cmd, "pwrite(%d,%f)", pin, power);
  m_pTransport->execute(cmd);
}
  
  
  
  
