#pragma once

#ifdef ARDUINO
#include "Arduino.h"
#endif

#include "DUELinkTransport.h"
#include "Stream.h"

class FileSystemController
{
public:
    FileSystemController(DUELinkTransport &transport,StreamController &stream)
    {
        m_pTransport = &transport;
    }

    int ParseReturn() {
        DUELinkTransport::Response result = m_pTransport->ReadResponse();

        if (result.success)
            return atoi(result.response.c_str());
        return -1;
    }

    int Mount(int type, int cs, int baud, int max_handle) {
        char cmd[32];
       
        sprintf(cmd, "FsMnt(%d,%d,%d,%d)", type,cs,baud,max_handle);
        m_pTransport->WriteCommand(cmd);

        return ParseReturn();
    }

    int UnMount(int type, int cs, int baud, int max_handle) {
     
        m_pTransport->WriteCommand("FsUnMnt()");

        return ParseReturn();
    }

    int Format(int type, int cs, int baud) {
        char cmd[32];
       
        sprintf(cmd, "FsFmt(%d,%d,%d)", type,cs,baud);
        m_pTransport->WriteCommand(cmd);

        return ParseReturn();
    }

#ifdef ARDUINO
    int Open(String path,
#else
    int Open(std::string path,
#endif
        int mode)
    {
        char cmd[32];
       
        sprintf(cmd, "FsOpen(\"%s\",%d)", path,mode);
        m_pTransport->WriteCommand(cmd);

        return ParseReturn();
    }

    int Close(int handle) {
        char cmd[32];
       
        sprintf(cmd, "FsClose(%d)", handle);
        m_pTransport->WriteCommand(cmd);

        return ParseReturn();
    }

    int Write(int handle, const byte* dataWrite, int count) {
        char cmd[32];
        //declare b9 array
        sprintf(cmd, "dim b9[%d]", count);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();     

        //write data to b9
        int written = m_pStream->WriteBytes("b9", dataWrite, count);

        //write b9 to file
        sprintf(cmd, "FsWrite(%d,b9)", handle);
        m_pTransport->WriteCommand(cmd);
        return ParseReturn();
    }

    int Read(int handle, byte* dataRead, int count) {

        char cmd[32];
        //declare b9 array
        sprintf(cmd, "dim b9[%d]", count);
        m_pTransport->WriteCommand(cmd);
        DUELinkTransport::Response result = m_pTransport->ReadResponse();     
         
        //read data to b9
        sprintf(cmd, "FsRead(%d,b9)", handle);
        m_pTransport->WriteCommand(cmd);
        result = m_pTransport->ReadResponse();   

        //read b9 by stream
        int read = m_pStream->ReadBytes("b9", dataRead, count);

        return read;
    }

    int Sync(int handle) {
        char cmd[32];
       
        sprintf(cmd, "FsSync(%d)", handle);
        m_pTransport->WriteCommand(cmd);

        return ParseReturn();
    }

    int Seek(int handle,int offset) {
        char cmd[32];
       
        sprintf(cmd, "FsSeek(%d,%d)", handle,offset);
        m_pTransport->WriteCommand(cmd);

        return ParseReturn();
    }

    int Tell(int handle) {
        char cmd[32];
       
        sprintf(cmd, "FsTell(%d)", handle);
        m_pTransport->WriteCommand(cmd);

        return ParseReturn();
    }

#ifdef ARDUINO
    int Find(String path)
#else
    int Find(std::string path)
#endif
    {    
        char cmd[32];
       
        sprintf(cmd, "FsDel(\"%s\")", path);
        m_pTransport->WriteCommand(cmd);

        return ParseReturn();
    }

#ifdef ARDUINO
    int Size(String path)
#else
    int Size(std::string path)
#endif
    {    
        char cmd[32];
       
        sprintf(cmd, "fsfsz(\"%s\")", path);
        m_pTransport->WriteCommand(cmd);

        return ParseReturn();
    }

    

private:
    DUELinkTransport *m_pTransport = NULL;
    StreamController *m_pStream = NULL;
};
