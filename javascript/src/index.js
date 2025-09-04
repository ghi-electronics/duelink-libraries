import {SerialUSB} from './serialusb.js';
import * as due from './duelink.js';
import { Util } from "./util.js";
import delay from 'delay';
//import { createCanvas, loadImage } from 'canvas';

async function toHex(number, length = 4) {
    let hexString = number.toString(16);
    while (hexString.length < length) {
    hexString = '0' + hexString;
    }
    return hexString;
}


let duelink = new due.DUELinkController(new SerialUSB());
await duelink.Connect();

await duelink.System.StatLed(100,100,0);

//await duelink.Sound.Beep(7, 1000, 100);

let pid = await toHex(await duelink.System.Info(0)/1)
let ver = (await duelink.System.Info(1)/1.0).toString()

console.log(pid)
console.log(ver)



