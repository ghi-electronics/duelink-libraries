//
//  SerialPortLowlevel.c
//  
//
//


#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#include <fcntl.h>

#include <unistd.h>
#include <stdint.h>
#include <termios.h>
#include <errno.h> //errno

#include <SerialPortLowlevel.h>
static const int SFD_UNAVAILABLE = -1;

int SerialPortLowlevelOpen( const char* portPath){
    int baudRate = 9600;
    int sfd;

    
    //Open port, checking for errors
    sfd = open(portPath, (O_RDWR | O_NOCTTY | O_NDELAY));
    if (sfd == -1) {
        return sfd;
    }
    
    //Configure i/o baud rate settings
    struct termios options;
    tcgetattr(sfd, &options);
    switch (baudRate) {
        case 9600:
            cfsetispeed(&options, B9600);
            cfsetospeed(&options, B9600);
            break;
        case 19200:
            cfsetispeed(&options, B19200);
            cfsetospeed(&options,B19200);
            break;
        case 38400:
            cfsetispeed(&options, B38400);
            cfsetospeed(&options, B38400);
            break;
        case 57600:
            cfsetispeed(&options, B57600);
            cfsetospeed(&options, B57600);
            break;
        default:
            printf("Requested baud rate %d not currently supported. Defaulting to 9,600.\n", baudRate);
            cfsetispeed(&options, B9600);
            cfsetospeed(&options, B9600);
            break;
    }
    
    //Configure other settings
    //Settings from:
    //  https://github.com/Marzac/rs232/blob/master/rs232-linux.c
    //
    options.c_iflag &= ~(INLCR | ICRNL);
    options.c_iflag |= IGNPAR | IGNBRK;
    options.c_oflag &= ~(OPOST | ONLCR | OCRNL);
    options.c_cflag &= ~(PARENB | PARODD | CSTOPB | CSIZE | CRTSCTS);
    options.c_cflag |= CLOCAL | CREAD | CS8;
    options.c_lflag &= ~(ICANON | ISIG | ECHO);
    options.c_cc[VTIME] = 1;
    options.c_cc[VMIN]  = 0;
    
    //Apply settings
    //TCSANOW vs TCSAFLUSH? Was using TCSAFLUSH; settings source above
    //uses TCSANOW.
    if (tcsetattr(sfd, TCSANOW, &options) < 0) {
        printf("Error setting serial port attributes.\n");
        close(sfd);
        return -2; //Using negative value; -1 used above for different failure
    }
        
    return sfd;
}

int SerialPortLowlevelWrite(int sfd, const char* data, int count) {
    if (!SerialPortLowlevelIsOpened(sfd)) {
        return -1;
    }
    
    int numBytesWritten = (int)write(sfd, data, count);
        
    return numBytesWritten;
}

int SerialPortLowlevelReadByte(int sfd) {
    char data;
    
    if (!SerialPortLowlevelIsOpened(sfd)) {
        return -1;
    }

    if (read(sfd, &data, 1) <= 0)
        return -1;

    return data;
}

int SerialPortLowlevelIsOpened(int sfd) {
    return sfd != SFD_UNAVAILABLE ? 1 : 0;
}

int SerialPortLowlevelClose(int sfd) {
    int result = 0;
    if (SerialPortLowlevelIsOpened(sfd)) {
        result = close(sfd);
        sfd = SFD_UNAVAILABLE;
    }
    return result;
    
}

int SerialPortLowlevelFlush(int sfd) {
    if (!SerialPortLowlevelIsOpened(sfd)) {
        return -1;
    }
    int result = 0;

    // TODO
    return result;
    
}
