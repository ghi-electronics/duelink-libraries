#pragma once


#include "DUELink.h"

bool DUELink::Connect() {
        
    m_pTransport->begin();
    m_pTransport->sync();
    
    return 1;
}
    
void DUELink::SetTimeout(int timeout_ms) {
    m_pTransport->ReadTimeout = timeout_ms;
}

int DUELink::GetTimeout() {
    return m_pTransport->ReadTimeout;
}

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