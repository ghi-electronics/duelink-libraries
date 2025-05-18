#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "Led.h"

  void LedController::Set(int high, int low, int count) {
    char cmd[32];
    sprintf(cmd, "statled(%d,%d,%d)", high, low, count);
    m_pTransport->execute(cmd);
  }
  
  
  
  
