#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkLib.h"

void DUELink::begin(DUELinkTransport &transport) {
    char escseq[] = {0x1b, 0};

    m_pTransport = &transport;
    m_pTransport->begin();
    execute(escseq);
    execute(escseq);
    execute(">");
    echo(0);
  }
  
  DUELink::Response DUELink::execute(const char *command) {
    char buf[128] = {0};
  
    m_pTransport->beginTransmission();
    m_pTransport->write(command);
    m_pTransport->write("\n");
    m_pTransport->endTransmission();
  
    m_pTransport->read(&buf[0], sizeof(buf), DUELINK_TIMEOUT);
  
    return getResponse(command, buf);
  }
  
  void DUELink::echo(int state) {
    if (state) 
      execute("echo(1)");
    else
      execute("echo(0)");
  }
  
  void DUELink::led(int high, int low, int count) {
    char cmd[32];
    sprintf(cmd, "led(%d,%d,%d)", high, low, count);
    execute(cmd);
  }
  
  bool DUELink::dread(int pin, int pull) {
    char cmd[32];
    sprintf(cmd, "dread(%d,%d)", pin, pull);
    Response result = execute(cmd);
    if (result.success) return atoi(result.result.c_str());
    return false;
  }
  
  void DUELink::dwrite(int pin, int state) {
    char cmd[32];
    sprintf(cmd, "dwrite(%d,%d)", pin, state);
    execute(cmd);
  }
  
  float DUELink::vread(int pin) {
    char cmd[32];
    sprintf(cmd, "vread(%d)", pin);
    Response result = execute(cmd);
    if (result.success) return atof(result.result.c_str());
    return 0;
  }
  
  void DUELink::pwrite(int pin, float power) {
    char cmd[32];
    sprintf(cmd, "pwrite(%d,%f)", pin, power);
    execute(cmd);
  }
  
  void DUELink::beep(int pin, int freq, int duration) {
    char cmd[32];
    sprintf(cmd, "beep(%d,%d,%d)", pin, freq, duration);
    execute(cmd);
  }
  
  void DUELink::btnEnable(int pin, bool enable) {
    char cmd[32];
    sprintf(cmd, "btnenable(%d,%d)", pin, enable ? 1 : 0);
    execute(cmd);
  }
  
  bool DUELink::btnUp(int pin) {
    char cmd[32];
    sprintf(cmd, "btnup(%d)", pin);
    Response result = execute(cmd);
    if (result.success) return result.result[0] == '1' ? true : false;
    return false;
  }
  
  bool DUELink::btnDown(int pin) {
    char cmd[32];
    sprintf(cmd, "btndown(%d)", pin);
    Response result = execute(cmd);
    if (result.success) return result.result[0] == '1' ? true : false;
    return false;
  }
  
  DUELink::Response DUELink::getResponse(String command, String response) {
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