#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#include "Wire.h"
#else
#include <string>
class String : public std::string {
public:
    String() : std::string() {}
    String(String &other) {*this = other;}
    String(const char *s) : std::string(s) {}

    size_t indexOf(String &s, size_t pos = 0) { return this->find(s.c_str(), pos); }
    size_t indexOf(const char *s, size_t pos = 0) { return this->find(s, pos); }
    String substring(size_t from, size_t to) { return this->substr(from, to-from).c_str();}
};
#endif

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

    virtual Response streamOutBytes(const char *bytes, int count) = 0;
    virtual Response streamOutFloats(const float *floats, int count) = 0;

    virtual int read(char *buf, int bytes, unsigned long timeout) = 0;
    
    virtual Response execute(const char *command) = 0;
    
    virtual void sync() = 0;

    // virtual void sync() {
        // char buf[128] = {0};

        // beginTransmission();
        // write("\x1b");
        // endTransmission();
        // read(&buf[0], sizeof(buf), DUELINK_TIMEOUT);
        // getResponse("", buf);
    // }
    
private:
    virtual Response getResponse(String command, String response) = 0;    

protected:
    const static unsigned long DUELINK_TIMEOUT = 1000;
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

    virtual Response streamOutBytes(const char *bytes, int count) {
        char buf[128] = {0};
        beginTransmission();
        m_link.write(bytes, count);
        endTransmission();
        read(&buf[0], sizeof(buf), DUELINK_TIMEOUT);
        return getResponse("", buf);
    }

    virtual Response streamOutFloats(const float *floats, int count) {
        char buf[128] = {0};
        beginTransmission();
        for(int i=0; i<count; ++i) {
            m_link.write((const char *)&floats[i], 4);
        }
        endTransmission();
        read(&buf[0], sizeof(buf), DUELINK_TIMEOUT);
        return getResponse("", buf);
    }

    virtual int read(char *buf, int bytes, unsigned long timeout) {
        unsigned long startms = millis();
        
        uint32_t bytesToRead = 0;
        char *p = &buf[0];
        while ((millis() - startms) < timeout) {
            m_link.requestFrom(m_i2cAddress, 1, 1);
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
            m_link.requestFrom(m_i2cAddress, bytesToRead, 1);
            while ((millis() - startms) < timeout && m_link.available()) {
                int c = m_link.read();
                if (c >= 0 && c <= 127) {
                    *p++ = (uint8_t)c;
                }      
            }  
        }
        *p = '\0';

        return p-buf;
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
    
    virtual void sync() {
        char buf[128] = {0};

        beginTransmission();
        write("\x1b");
        endTransmission();
        read(&buf[0], sizeof(buf), DUELINK_TIMEOUT);
        getResponse("", buf);
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
      
        if (response[cmdIdx] == '>') return {.result = "", .success = success};
      
        int endIdx = response.indexOf("\r\n>", cmdIdx);  
        if (endIdx >= cmdIdx) {
          return {.result = response.substring(cmdIdx, endIdx), .success = success};
        }
      
        return {.result = "", .success = success};
      }

private:
    TwoWire &m_link;
    int m_i2cAddress;
};

class SerialTransport : public DUELinkTransport {
public:
    SerialTransport(Stream &link) : m_link(link) {}

    virtual void begin() {
        
    }
    
    virtual void beginTransmission() {
        
    }

    virtual void write(const char *str) {
        m_link.write(str);
    }

    virtual void endTransmission() {
       
    }

    virtual int read(char *buf, int bytes, unsigned long timeout) {
        unsigned long startms = millis();
        
        uint32_t bytesToRead = 0;
        char *p = &buf[0];
        while ((millis() - startms) < timeout) {
            if (m_link.available()) {
                int c = m_link.read();
                if (c >= 0 && c <= 127) {
                    bytesToRead = bytes - 2;
                    *p++ = (uint8_t)c;
                    break;
                }
            }
        }
        
        if (bytesToRead && buf[0] != '>' && buf[0] != '&') {
            while ((millis() - startms) < timeout && bytesToRead) {
                int c = m_link.read();
                if (c >= 0 && c <= 127) {
                    --bytesToRead;
                    *p++ = (uint8_t)c;
                    if ((p-buf) >= 3 && *(p-1)=='>' && *(p-2) == '\n' && *(p-3) == '\r') {
                        break;
                    }
                }      
            }  
        }
        *p = '\0';
        return p-buf;
    }
    
    virtual Response execute(const char *command) {
        char buf[128] = {0};
        write(command);
        write("\n");
        read(&buf[0], sizeof(buf), DUELINK_TIMEOUT);
        return getResponse(command, buf);
    }

    virtual Response streamOutBytes(const char *bytes, int count) {
        char buf[128] = {0};
        m_link.write(bytes, count);
        read(&buf[0], sizeof(buf), DUELINK_TIMEOUT);
        return getResponse("", buf);
    }

    virtual Response streamOutFloats(const float *floats, int count) {
        char buf[128] = {0};
        for(int i=0; i<count; ++i) {
            m_link.write((const char *)(&floats[i]), 4);
        }
        read(&buf[0], sizeof(buf), DUELINK_TIMEOUT);
        return getResponse("", buf);
    }
    
    
    virtual void sync() {
        char buf[128] = {0};

        beginTransmission();
        write("\x1b");
        endTransmission();
        read(&buf[0], sizeof(buf), DUELINK_TIMEOUT);
        getResponse("", buf);
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
      
        if (response[cmdIdx] == '>' || response[cmdIdx] == '&') 
            return {.result = "", .success = success};
      
        int endIdx = response.indexOf("\r\n>", cmdIdx);  
        if (endIdx >= cmdIdx) {
          return {.result = response.substring(cmdIdx, endIdx), .success = success};
        }
      
        return {.result = "", .success = success};
    }

private:
    Stream &m_link;
};

String build_bytearray(const char *data, int offset, int count) {
    char buf[5];
    String arr;
    arr = "[";
    int i = offset;
    while (count > 0) {
        if (i>offset) {
            arr += ",";
        }
        itoa(data[i++],buf,10);
        arr+=buf;
        --count;
    }
    arr+="]";
    return arr;
}

String build_floatarray(const float *data, int offset, int count) {
    char buf[5];
    String arr;
    arr = "{";
    int i = offset;
    while (count > 0) {
        if (i>offset) {
            arr += ",";
        }
        sprintf(buf, "%g", data[i++]);
        arr+=buf;
        --count;
    }
    arr+="}";
    return arr;
}
