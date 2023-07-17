// Install the canvas library
// npm install canvas

import {SerialUSB} from './serialusb.js';
import * as due from './duelink.js';
import {createCanvas} from 'canvas';

let BrainPad = new due.DUELinkController(new SerialUSB());
await BrainPad.Connect();

const canvas = createCanvas(128, 64)
const ctx = canvas.getContext('2d')

let x=10;
let y=15;
let dx=1;
let dy=1;

for(;;) {
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 128, 64);

    // Write "Awesome!"
    ctx.strokeStyle = 'white';
    ctx.font = '24px Arial'
    ctx.strokeText('Awesome!', x, y)

    let pixelData = ctx.getImageData(0,0,128,64).data;
    await BrainPad.Display.DrawBuffer(pixelData);

    x+=dx;
    y+=dy;
    if (x < 0 || x > 63) dx = -dx;
    if (y < 0 || y > 63) dy = -dy;
}