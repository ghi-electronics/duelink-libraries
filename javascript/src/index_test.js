import {SerialUSB} from './serialusb.js';
import * as due from './duelink.js';
import { Util } from "./util.js";
//import { createCanvas, loadImage } from 'canvas';

let duelink = new due.DUELinkController(new SerialUSB());
await duelink.Connect();

await duelink.Sound.Beep(7, 1000, 100);