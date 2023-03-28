import Foundation
import SerialPortLowlevel

public class SerialPort {

    var portPath: String;
    var handeId : Int32;
    public var Timeout : Int32 ;

    public init(portpath: String) {
        portPath = portpath;
        handeId = -1;
        Timeout = -1;
    }
    
    deinit {
        SerialPortLowlevelClose(handeId);
    }
    public func Open() -> Bool{
    
        handeId = SerialPortLowlevelOpen(portPath);
        
        return handeId != -1;
  
    }
    public func Write(data: [CChar], offset: Int32, count: Int32) -> Int32
    {
        return SerialPortLowlevelWrite(handeId, data, count);
    }
    public func ReadByte() -> Int32 {
        var data8 : Int32;
        data8 = -1;
        var to = Timeout;
        
        while (data8 == -1) {
            data8 = SerialPortLowlevelReadByte(handeId);
            
            if (data8 != -1) {
                return data8;
            }

            if (to > -1) {
                usleep(1000);
                to = to - 1;
                
                if (to == 0) {
                    break;
                }
            }
        }
        
        return data8;
    }
    public func Read(data: inout [CChar], offset: Int32, count: Int32) -> Int32 {
        var totalread = 0;
        var left = count;
        var to = Timeout;

        while (left > 0) {
            var data8 = SerialPortLowlevelReadByte(handeId);
            
            if (data8 != -1) {
                data[totalread] = CChar(data8);
                totalread = totalread + 1;
                left = left - 1;
                to = Timeout; // reset timeout
            } else {
                if (to > -1) {
                    usleep(1000);
                    if (to == 0) {
                        break;
                    }
                    else {
                        to = to - 1;
                    }
                }
            }
        }
        
        return Int32(totalread);
    }
    
    public func Close() {
        SerialPortLowlevelClose(handeId);
    }
    
    public func Flush() {
        SerialPortLowlevelFlush(handeId);
    }
    
    public func IsOpened() {
        SerialPortLowlevelIsOpened(handeId);
    }
}
