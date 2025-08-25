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
        String response;
#else
        std::string response;
#endif
        bool success;
    };
    
public:
    int ReadTimeout = 3000;
    int TransferBlockSizeMax = 128;
    int TransferBlockDelay = 10;

    virtual void begin() = 0;
    virtual void beginTransmission() = 0;
    virtual void write(const char *str) = 0;    
    virtual void endTransmission() = 0;
    virtual Response ReadResponse() = 0;
    virtual Response ReadResponseRaw() = 0;
    virtual int ReadByte() = 0;
    virtual void WriteByte(byte b) = 0;
    virtual void WriteBytes(const byte* data, int count) = 0;
    virtual void Disconnect() = 0;
    virtual void sync() = 0;
    
    virtual void WriteCommand(const char *command) {
        DiscardInBuffer();
        beginTransmission();
        write(command);
        write("\n");
        endTransmission();
    }
    
    virtual void WriteRawData(const byte* buffer, int offset, int count) {
        int block = count / TransferBlockSizeMax;
        int remain = count % TransferBlockSizeMax; 
        int idx = offset;

        while (block > 0) {
            WriteBytes(&buffer[idx], TransferBlockSizeMax);
            idx += TransferBlockSizeMax;
            block--;
            delay(TransferBlockDelay);
        }

        if (remain > 0) {
            WriteBytes(&buffer[idx], remain);            
        }
    }
    virtual int ReadRawData(byte* buffer, int offset, int count) {
        unsigned long end = millis() + ReadTimeout;
        int totalRead = 0;
        int i = offset;
        while (end > millis() && totalRead < count) {
            delay(1); // make sure we have data
            int read = ReadByte();
            buffer[i] = read;
            i++;
            totalRead++;
        }
        
        return totalRead;
    }

    virtual void DiscardInBuffer() = 0;
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
    
    virtual void sync() {
    
        beginTransmission();
        write("\n");
        endTransmission();

        delay(400);

        WriteCommand("sel(1)"); //"sel(1)": always return \r\n> no matter Asio or not
        
        // devive will response 3 byte \r\n>
        unsigned long end = millis() + ReadTimeout;
        int dump = ReadByte();

        if (dump == 255 && millis() < end) {
            delay(1); 
            dump = ReadByte();
        }
               
        DiscardInBuffer();
    }
    
    virtual void Disconnect() {
        m_link.end();
    }

    virtual void WriteByte(byte b) {
        beginTransmission();
        m_link.write(b);
        endTransmission();
    }

    virtual void WriteBytes(const byte* data, int count) {
        beginTransmission();
        m_link.write(data, count);
        endTransmission();
    }

    virtual int ReadByte() {
        m_link.requestFrom(m_i2cAddress, 1, 1);

        if (m_link.available()) {
            int c = m_link.read();
            if (c >= 0 && c <= 127) {
                return c;
            }
            else {
                return 255;
            }
        }
        return 255;
    }
    


    virtual Response ReadResponse() {
        unsigned long startms = millis();
        char str_arr[128] = {0};
        int total_receviced = 0;
        bool responseValid = true;
        int dump = -1;
        int data = -1;
        char *p = &str_arr[0];

        while (millis()  < startms + ReadTimeout) {
            data = ReadByte();

            if (data > 127) {
                delay(1); // no data available, it is 255 - No data in i2c
                continue;
            }
            *p = data;
            p++;
            total_receviced++;

            if (data == '\n') {
            _process_response:
                delay(1); //wait 1ms for sure

                dump = ReadByte();

                //next byte can be >, &, !, $
                if (dump < 127) {
                    if (dump == '>' || dump == '!' || dump == '$') {
                        delay(1); //wait 1ms for sure

                        dump = ReadByte();

                        if (dump != 255) {
                            responseValid = false;
                        }
                    }
                    else if (dump == '\r') {
                        // user can call println(btnup(0)) example, this will return 0\r\n\r\n> => this is still valid
                        delay(1); //wait 1ms for sure
                        dump = ReadByte();

                        if (dump == '\n') {
                            goto _process_response;
                        }
                        else {
                            responseValid = false; 
                        }
                    }
                }
                if (responseValid == false) {
                    dump = -1;

                    while (dump != '\n' && (millis()  < startms + ReadTimeout)) {
                        delay(1); //wait 1ms for sure
                        dump = ReadByte();

                        if (dump == '\n') {
                            delay(1); //wait 1ms for sure
                            dump = ReadByte();

                            if (dump == 255)
                                break;
                        }
                    }
                }

                if (total_receviced < 2) {// reponse valid has to be xxx\r\n or \r\n, mean idx >=2                
                    responseValid = false;
                }
                else if (responseValid == true) {
                    if (str_arr[total_receviced-2] != '\r') {
                        responseValid = false;
                    }
                    else {
                        // valid response, remove \r\n
                        str_arr[total_receviced-2] = 0;
                        str_arr[total_receviced-1] = 0;
                    }
                }

                break; // \n found, 

            }

            startms = millis(); // reset timeout when new data come

        }

        return {.response = str_arr, .success = responseValid};

    }
    
    virtual Response ReadResponseRaw() {
#ifdef ARDUINO
        String str;
#else
        std::string str;
#endif
        unsigned long startms = millis();
        int len = 0;
        while (millis()  < startms + ReadTimeout) {
            byte data = ReadByte();

            if (data > 127) {
                delay(1); // no data available, it is 255 - No data in i2c
                continue;
            }
            
            str += (char)data;
            len++;
            
            startms = millis();
        }
        
        if (len > 3) {            
            return {.response = str.substring(0, len-3), .success = true};
        }
        
        return {.response = "", .success = false};
        
    }
    
    virtual void DiscardInBuffer() { // i2c discard
        while (ReadByte() != 255);
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
    
    virtual void sync() {
    
        beginTransmission();
        write("\n");
        endTransmission();

        delay(300);

        WriteCommand("sel(1)"); //"sel(1)": always return \r\n> no matter Asio or not
        
        delay(100);
        
        // devive will response 3 byte \r\n>
        unsigned long end = millis() + ReadTimeout;

        if (m_link.available() == 0 && millis() < end) {
            delay(1);             
        }        
               
        DiscardInBuffer();
    }
    
    virtual void Disconnect() {
        
    }

    virtual void WriteByte(byte b) {
        beginTransmission();
        m_link.write(b);
        endTransmission();
    }

    virtual void WriteBytes(const byte* data, int count) {
        beginTransmission();
        m_link.write(data, count);
        endTransmission();
    }

    virtual int ReadByte() {
        if (m_link.available()) {
            int c = m_link.read();
            if (c >= 0 && c <= 127) {
                return c;
            }
            else {
                return 255;
            }
        }
        return 255;
    }


    virtual Response ReadResponse() {
        unsigned long startms = millis();
        char str_arr[128] = {0};
        int total_receviced = 0;
        bool responseValid = true;
        int dump = -1;
        int data = -1;
        char *p = &str_arr[0];

        while (millis()  < startms + ReadTimeout) {
            if (m_link.available() > 0) { 
                data = ReadByte();
                *p = data;
                p++;
                total_receviced++;

                if (data == '\n') {
                _process_response:
                    if (m_link.available() == 0) 
                        delay(1); //wait 1ms for sure

                    //next byte can be >, &, !, $   
                    if (m_link.available() > 0) {
                        dump = ReadByte();

                                         
                        if (dump == '>' || dump == '!' || dump == '$') {
                            delay(1); //wait 1ms for sure

                            if (m_link.available() > 0) {
                                responseValid = false; // still data, this is bad response, there is no \r\n>xxxx
                            }
                        }
                        else if (dump == '\r') {
                            // user can call println(btnup(0)) example, this will return 0\r\n\r\n> => this is still valid
                            if (m_link.available() == 0) 
                                delay(1); //wait 1ms for sure
                            
                            if (m_link.available() >0) {
                                dump = ReadByte();

                                if (dump == '\n') {
                                    goto _process_response;
                                }
                                else {
                                    responseValid = false; 
                                }
                            }
                            else {
                                responseValid = false; // after \r must be something, and \n is expected
                            }
                        }
                        else {
                            // bad data
                            // One cmd send suppose one response, there is no 1234\r\n5678.... this will consider invalid response
                            responseValid = false;
                        }
                    }
                    
                    // once bad response \r\nxxx... or \r\n>xxxx, mean next \r\n is comming, wait timeout to clear them to clean the bus if possible        
                    if (responseValid == false) {
                        dump = 0;

                        // \r\n must be comming because \r\nxxxx....\r\n  
                        while (dump != '\n' && (millis()  < startms + ReadTimeout)) {                            
                            if (m_link.available() > 0) {
                                dump = ReadByte();
                            }
                            else {
                                delay(1); //wait 1ms for sure
                            }

                            if (dump == '\n') {
                                if (m_link.available() > 0) { // still bad data, repeat clean up
                                     dump = 0; // reset to repeat the condition while loop
                                }
                            }
                        }
                    }

                    if (total_receviced < 2) {// reponse valid has to be xxx\r\n or \r\n, mean idx >=2                
                        responseValid = false;
                    }
                    else if (responseValid == true) {
                        if (str_arr[total_receviced-2] != '\r') {
                            responseValid = false;
                        }
                        else {
                            // valid response, remove \r\n
                            str_arr[total_receviced-2] = 0;
                            str_arr[total_receviced-1] = 0;
                        }
                    }

                    break; // \n found, 

                }

                startms = millis(); // reset timeout when new data come
            }    

        }

        return {.response = str_arr, .success = responseValid};

    }
    
    virtual Response ReadResponseRaw() {
#ifdef ARDUINO
        String str;
#else
        std::string str;
#endif
        unsigned long startms = millis();
        int len = 0;
        while (millis()  < startms + ReadTimeout) {
            if (m_link.available() > 0) {
                byte data = ReadByte();

                str += (char)data;
                len++;
                
                startms = millis();
            }
        }
        
        if (len > 3) {            
            return {.response = str.substring(0, len-3), .success = true};
        }
        
        return {.response = "", .success = false};
        
    }
    
    virtual void DiscardInBuffer() { // uart discard
        while (m_link.available() > 0 ) {
            byte dump = ReadByte(); // dump all
        }
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
