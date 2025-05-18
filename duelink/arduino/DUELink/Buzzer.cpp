#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "Buzzer.h"

void BuzzerController::PlayBeep(int freq, int duration){
  char cmd[32];
  sprintf(cmd, "beep(7, %d,%d)", freq, duration);
  m_pTransport->execute(cmd);
}

void BuzzerController::PlaySound(int freq, int duration, float dc){
  char cmd[32];
  sprintf(cmd, "freq(7,%d,%d,%0.2f)", freq, duration, dc);
  m_pTransport->execute(cmd);
}

void BuzzerController::PlayMelody(float *data, int count) {
  char cmd[1024] = {0};
  char element[20];

  strcat(cmd, "melodyp(7,{");
  for(int i=0; i<count; i++) {
    if (i > 0) strcat(cmd, ",");
    snprintf(element, sizeof(element), "%0.2f", *data++);
    strcat(cmd, element);
  }
  strcat(cmd, "})");
  
  m_pTransport->execute(cmd);
}

void BuzzerController::StopMelody() {
  m_pTransport->execute("melodys(7)");
}
  
  
  
  
