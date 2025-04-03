#pragma once

#include "Arduino.h"
#include "Wire.h"

class DUELinkTransport {
public:
    struct Response {
#ifdef ARDUINO
        String result;
#else
        std::string result;
#endif
        bool success;
    };
    
public:
    virtual void begin() = 0;
    virtual void beginTransmission() = 0;
    virtual void write(const char *str) = 0;
    virtual void endTransmission() = 0;

    virtual int read(char *buf, int bytes, unsigned long timeout) = 0;
    
    virtual Response execute(const char *command);
    
private:
    virtual Response getResponse(String command, String response);    
};

class TwoWireTransport : public DUELinkTransport {
public:
    TwoWireTransport(TwoWire &link, int i2cAddress = 0x52) : m_link(link), m_i2cAddress(i2cAddress) {}

    virtual void begin() {
        m_link.begin();
    }
    
    virtual void beginTransmission() {
        m_link.beginTransmission(m_i2cAddress);
    }

    virtual void write(const char *str) {
        m_link.write(str);
    }

    virtual void endTransmission() {
        m_link.endTransmission();
    }

    virtual int read(char *buf, int bytes, unsigned long timeout) {
        unsigned long startms = millis();
        
        uint32_t bytesToRead = 0;
        char *p = &buf[0];
        while ((millis() - startms) < timeout) {
            m_link.requestFrom(m_i2cAddress, 1, true);
            if (m_link.available()) {
            int c = m_link.read();
            if (c >= 0 && c <= 127) {
                bytesToRead = bytes - 2;
                *p++ = (uint8_t)c;
                break;
            }
            }
        }
        if (bytesToRead && buf[0] != '>') {
            m_link.requestFrom(m_i2cAddress, bytesToRead, true);
            while ((millis() - startms) < timeout && m_link.available()) {
            int c = m_link.read();
            if (c >= 0 && c <= 127) {
                *p++ = (uint8_t)c;
            }      
            }  
        }
        *p = '\0';
    }
    
    virtual Response execute(const char *command) {
        char buf[128] = {0};

        beginTransmission();
        write(command);
        write("\n");
        endTransmission();

        read(&buf[0], sizeof(buf), DUELINK_TIMEOUT);

        return getResponse(command, buf);
    }
    
    virtual Response getResponse(String command, String response) {
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

private:
    TwoWire &m_link;
    int m_i2cAddress;
    
    const static unsigned long DUELINK_TIMEOUT = 1000;
};
