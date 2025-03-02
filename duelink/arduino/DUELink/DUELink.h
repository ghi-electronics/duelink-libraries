#pragma once

#include "Arduino.h"
#include "Wire.h"
#include "DUELinkLib.h"

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

private:
    TwoWire &m_link;
    int m_i2cAddress;
};
