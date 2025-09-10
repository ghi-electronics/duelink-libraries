#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

class StreamController
{
public:
    StreamController(DUELinkTransport &transport)
    {
        m_pTransport = &transport;
    }

    int WriteSpi(const uint8_t* data, int count)
    {
        char cmd[32];
        sprintf(cmd, "strmspi(%d)", count);
        m_pTransport->WriteCommand(cmd);

        // wait for prompt &
        int prompt = 0;
        while (prompt != '&') {
            prompt = m_pTransport->ReadByte();            
        }

        // ready to write data
        m_pTransport->WriteRawData(data, 0, count);

        // read x\r\n>
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        if (result.success)
            return atof(result.response.c_str());
        return 0;
    }

    int WriteBytes(const char* arr, const uint8_t* data, int count)
    {        
        char cmd[32];
        sprintf(cmd, "strmwr(%s,%d)", arr,count);
        m_pTransport->WriteCommand(cmd);

        // wait for prompt &
        int prompt = 0;
        while (prompt != '&') {
            prompt = m_pTransport->ReadByte();
            
            delay(1);
        }

        // ready to write data
        m_pTransport->WriteRawData(data, 0, count);

        // read x\r\n>
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        if (result.success)
            return atof(result.response.c_str());
        return 0;
    }

    int WriteFloats(const char* arr, const float* data, int count)
    {        
        char cmd[32];
        FloatBytes *fb = new FloatBytes[count];

        sprintf(cmd, "strmwr(%s,%d)", arr,count);
        m_pTransport->WriteCommand(cmd);

        // wait for prompt &
        int prompt = 0;
        while (prompt != '&') {
            prompt = m_pTransport->ReadByte();            
        }

        // ready to write data
        for (int i = 0; i < count; i++) {
            fb[i].f = data[i];
                        
            m_pTransport->WriteRawData(fb[i].bytes, 0, 4);
        }
        delete []fb;
        // read x\r\n>
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        if (result.success)
            return atof(result.response.c_str());
        return 0;
    }

    int ReadBytes(const char* arr, uint8_t* data, int count)
    {        
        char cmd[32];
        sprintf(cmd, "strmrd(%s,%d)", arr,count);
        m_pTransport->WriteCommand(cmd);

        // wait for prompt &
        int prompt = 0;
        while (prompt != '&') {
            prompt = m_pTransport->ReadByte();            
        }

        // ready to write data
        m_pTransport->ReadRawData(data, 0, count);

        // read x\r\n>
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        if (result.success)
            return atof(result.response.c_str());
        return 0;
    }

    int ReadFloats(const char* arr, float* data, int count)
    {        
        char cmd[32];
        FloatBytes *fb = new FloatBytes[count];

        memset(fb, 0, sizeof(fb) * count);

        sprintf(cmd, "strmrd(%s,%d)", arr,count);
        m_pTransport->WriteCommand(cmd);

        // wait for prompt &
        int prompt = 0;
        while (prompt != '&') {
            prompt = m_pTransport->ReadByte();            
        }

        // ready to write data
        for (int i = 0; i < count; i++) {
            m_pTransport->ReadRawData(fb[i].bytes, 0, 4);
            data[i] = fb[i].f;
        }

        
        delete []fb;
        // read x\r\n>
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        if (result.success)
            return atof(result.response.c_str());
        return 0;
    }
   

private:
    DUELinkTransport *m_pTransport = NULL;
    
    union FloatBytes {
        float f;
        uint8_t bytes[sizeof(float)];
    };
};
