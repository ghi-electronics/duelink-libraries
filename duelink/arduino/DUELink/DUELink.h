#pragma once

#ifndef ARDUINO
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

#include "DUELinkTransport.h"
#include "Led.h"
#include "Digital.h"
#include "Analog.h"


class DUELink {


public:
    DUELink(DUELinkTransport &transport) ;
    /*
    void begin(DUELinkTransport &transport); 

    bool dread(int pin, int pull);
    void dwrite(int pin, int state);
    */
    LedController Led ;
    DigitalController Digital;
    AnalogController Analog;

    bool Connect();

private:
    
    DUELinkTransport *m_pTransport = NULL;
    int m_i2cAddress;

    
};