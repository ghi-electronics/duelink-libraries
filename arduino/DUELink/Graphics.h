#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"

enum class GraphicsType {
    I2c=1,
    Spi=2,
    Neo=3,
    Matrix5x5=4,
};

class GraphicsController {
public:
    GraphicsController(DUELinkTransport &transport) {
        m_pTransport = &transport;
    } 

    bool Configuration(GraphicsType type, const float *config, int configCount, int width, int height, int mode) {
        String cfg_array = build_floatarray(config, 0, configCount);
        char *cmd = new char[32+cfg_array.length()];
        sprintf(cmd, "gfxcfg(%d,%s,%d,%d,%d)", type, cfg_array.c_str(), width, height, mode);

        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        
        delete []cmd;
        return result.success;
    }

    bool Show() {
        m_pTransport->WriteCommand("show()");
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        return result.success;
    }

    bool Clear(int color) {
        char cmd[32];
        sprintf(cmd, "clear(%d)", color);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        return result.success;
    }

    bool Pixel(int color, int x, int y) {
        char cmd[64];
        sprintf(cmd, "pixel(%d,%d,%d)", color,x,y);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        return result.success;
    }
    
    bool Circle(int color, int x, int y, int r) {
        char cmd[128];
        sprintf(cmd, "circle(%d,%d,%d,%d)", color,x,y,r);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        return result.success;
    }

    bool Rect(int color, int x, int y, int w, int h) {
        char cmd[128];
        sprintf(cmd, "rect(%d,%d,%d,%d,%d)", color,x,y,w,h);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        return result.success;
    }

    bool Fill(int color, int x, int y, int w, int h) {
        char cmd[128];
        sprintf(cmd, "fill(%d,%d,%d,%d,%d)", color,x,y,w,h);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        return result.success;
    }

    bool Line(int color, int x1, int y1, int x2, int y2) {
        char cmd[128];
        sprintf(cmd, "line(%d,%d,%d,%d,%d)", color,x1,y1,x2,y2);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        return result.success;
    }

    bool Text(const char *text, int color, int x, int y) {
        char cmd[256];
        sprintf(cmd, "text(\"%s\",%d,%d,%d)", text, color,x,y);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        return result.success;
    }

    bool TextS(const char *text, int color, int x, int y, float sx, float sy) {
        char cmd[256];
        sprintf(cmd, "texts(\"%s\",%d,%d,%d,%g,%g)", text, color,x,y,sx,sy);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        return result.success;
    }

    bool TextT(const char *text, int color, int x, int y) {
        char cmd[256];
        sprintf(cmd, "textt(\"%s\",%d,%d,%d)", text, color,x,y);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        return result.success;
    }

    bool DrawImage(const void *data, int count, int x, int y, int w, int h, int transform) {
        return DrawImageScale(data, count, x, y, w, h, 1, 1, transform);
    }

    bool DrawImageScale(const void *data, int count, int x, int y, int w, int h, float sx, float sy, int transform) {
        String s;
        const char *arr;
        int extraBytes;

        if (count < 0) {
            arr = (const char *)data;
            extraBytes = strlen(arr)+1;
        } else {
            s = build_floatarray((float*)data, 0, count);
            arr = s.c_str();
            extraBytes = s.length()+1;
        }
        char *cmd = new char[64+extraBytes];
        sprintf(cmd, "imgs(%s,%d,%d,%d,%d,%g,%g,%d)", arr, x,y,w,h,sx,sy,transform);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();
        delete []cmd;
        return result.success;
    }

private:
    DUELinkTransport *m_pTransport = NULL;

};
  
  
