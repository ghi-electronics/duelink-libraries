//
//  Header.h
//  
//
//

#ifndef Header_h
#define Header_h


#endif /* Header_h */

int SerialPortLowlevelOpen( const char* portPath);
int SerialPortLowlevelWrite(int sfd, const char* data, int count);
int SerialPortLowlevelReadByte(int sfd);
int SerialPortLowlevelIsOpened(int sfd);
int SerialPortLowlevelFlush(int sfd);
int SerialPortLowlevelClose(int sfd);
