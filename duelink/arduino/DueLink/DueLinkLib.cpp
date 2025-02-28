#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DueLinkLib.h"

void DueLink::begin(DueLinkTransport &transport) {
    m_pTransport = &transport;
    m_pTransport->begin();
    echo(0);
  }
  
  DueLink::Response DueLink::execute(const char *command) {
    char buf[128] = {0};
  
    m_pTransport->beginTransmission();
    m_pTransport->write(command);
    m_pTransport->write("\n");
    m_pTransport->endTransmission();
  
    m_pTransport->read(&buf[0], sizeof(buf), DUELINK_TIMEOUT);
  
    return getResponse(command, buf);
  }
  
  void DueLink::echo(int state) {
    if (state) 
      execute("echo(1)");
    else
      execute("echo(0)");
  }
  
  void DueLink::led(int high, int low, int count) {
    char cmd[32];
    sprintf(cmd, "led(%d,%d,%d)", high, low, count);
    execute(cmd);
  }
  
  bool DueLink::dread(int pin, int pull) {
    char cmd[32];
    sprintf(cmd, "dread(%d,%d)", pin, pull);
    Response result = execute(cmd);
    if (result.success) return atoi(result.result.c_str());
    return false;
  }
  
  void DueLink::dwrite(int pin, int state) {
    char cmd[32];
    sprintf(cmd, "dwrite(%d,%d)", pin, state);
    execute(cmd);
  }
  
  float DueLink::vread(int pin) {
    char cmd[32];
    sprintf(cmd, "vread(%d)", pin);
    Response result = execute(cmd);
    if (result.success) return atof(result.result.c_str());
    return 0;
  }
  
  void DueLink::pwrite(int pin, float power) {
    char cmd[32];
    sprintf(cmd, "pwrite(%d,%f)", pin, power);
    execute(cmd);
  }
  
  void DueLink::beep(int pin, int freq, int duration) {
    char cmd[32];
    sprintf(cmd, "beep(%d,%d,%d)", pin, freq, duration);
    execute(cmd);
  }
  
  void DueLink::btnEnable(int pin, bool enable) {
    char cmd[32];
    sprintf(cmd, "btnenable(%d,%d)", pin, enable ? 1 : 0);
    execute(cmd);
  }
  
  bool DueLink::btnUp(int pin) {
    char cmd[32];
    sprintf(cmd, "btnup(%d)", pin);
    Response result = execute(cmd);
    if (result.success) return result.result[0] == '1' ? true : false;
    return false;
  }
  
  bool DueLink::btnDown(int pin) {
    char cmd[32];
    sprintf(cmd, "btndown(%d)", pin);
    Response result = execute(cmd);
    if (result.success) return result.result[0] == '1' ? true : false;
    return false;
  }
  
  DueLink::Response DueLink::getResponse(String command, String response) {
    int cmdIdx = response.indexOf(command);
    if (cmdIdx == -1) {
      cmdIdx = 0;
    } else {
      cmdIdx += command.length() + 2; // +2 to account for \r\n
    }
  
    bool success = response[cmdIdx] != '!';
    if (!success) cmdIdx++;
  
    if (response[0] == '>') return {.result = "", .success = success};
  
    int endIdx = response.indexOf("\r\n>", cmdIdx);  
    if (endIdx >= cmdIdx) {
      return {.result = response.substring(cmdIdx, endIdx), .success = success};
    }
  
    return {.result = "", .success = success};
  }