
import * as fs from 'fs';
import vm from 'node:vm';

function include(path) {
    var code = fs.readFileSync(path, 'utf-8');
    vm.runInThisContext(code, path);
}

//add library here
include('duelink.js');

//serial port lib
import { SerialPort } from 'serialport'

//due port detection
async function DetectPort(){
    var selected = ''
    var listPorts = SerialPort.list()
    var items = await listPorts;
    console.log(items)
    items.forEach(item => {
            if(item.serialNumber && item.serialNumber.startsWith('DUE')){
                selected = item.path;                
            }
        });
    return selected;
}

//find any due device
var selectPort = await DetectPort();
if(selectPort==='')
{
    console.log('cannot detect due compatible device, program exited.');
    process.exit(1);
}else{
    console.log('Selected Port:' + selectPort)
}

//init serial port
var serialport = new SerialPort({ path: selectPort, baudRate: 115200 })
var isReady = false;
serialport.on('open', () => {
    isReady = true;
    console.log('serial is ready');
})

//wait for serial com is ready
while (!isReady) {
    await sleep(100)
}

var comPort = new SerialInterface(serialport);
comPort.Connect();

var trycount = 30;
//wait for the firmware version for 3 secs
while (!comPort.isReady) {
    await sleep(100);
    trycount--;
    if (trycount <= 0) 
        throw Error("can't get the firmware version")
}

var duedemo = new DUELinkController(comPort);

// add sleep function!
async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

// blink 10 times
async function demo() {
    await duedemo.Led.Set(100,100,100);

    for (let i = 0; i < 10; i++) {
        //await duedemo.Digital.Write(108, true);
        //console.log(`turn led on...`+i);
        //await duedemo.System.Wait(20);
        //await duedemo.Digital.Write(108, false);
        //console.log(`turn led off...`+i);
        //await duedemo.System.Wait(20);
        await duedemo.System.Println("Flash-" + i);
    }

    let x = 64;
    let y = 32;
    let dx = 3;
    let dy = 2;

    duedemo.Button.Enable('A',1);
    for(;;) {
        await duedemo.Display.Clear(0);
        await duedemo.Display.DrawCircle(1,x,y,3);
        await duedemo.Display.Show();
        x+=dx;
        y+=dy;
        if (x < 0 || x > 128) dx = -dx;
        if (y < 0 || y > 64) dy = -dy;
        if (await duedemo.Button.WasPressed('A')) console.log("Pressed")
        if (await duedemo.Touch.Read(0)) console.log("Touch");
    }
}

await demo();

//close serial com
duedemo.Disconnect()

console.log("The End!");