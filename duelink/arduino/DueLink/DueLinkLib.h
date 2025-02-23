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

class DueLinkTransport {
public:
    virtual void begin() = 0;
    virtual void beginTransmission() = 0;
    virtual void write(const char *str) = 0;
    virtual void endTransmission() = 0;

    virtual int read(char *buf, int bytes, unsigned long timeout) = 0;
};

class DueLink {
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
    void begin(DueLinkTransport &transport); 
    
    Response execute(const char *command);

    void echo(int state);

    void led(int high, int low, int count);
    bool dread(int pin, int pull);
    void dwrite(int pin, int state);

    float vread(int pin);
    void pwrite(int pin, float power);

    void beep(int pin, int freq, int duration);
    // TODO: Melody

    void btnEnable(int pin, bool enable);
    bool btnUp(int pin);
    bool btnDown(int pin);

private:
    Response getResponse(String command, String response);

private:
    DueLinkTransport *m_pTransport = NULL;
    int m_i2cAddress;

    const static unsigned long DUELINK_TIMEOUT = 1000;
};