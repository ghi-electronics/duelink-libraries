import {SerialUSB} from './serialusb.js';
import * as due from './duelink.js';
import { createCanvas, loadImage } from 'canvas';

let BrainPad = new due.DUELinkController(new SerialUSB());
await BrainPad.Connect();

async function demo() {
    const canvas = createCanvas(BrainPad.Display.Width, BrainPad.Display.Height);
    const ctx = canvas.getContext('2d');
    const img = await loadImage("C:\\Users\\chris\\OneDrive\\Pictures\\Cape Town 2009\\DSCN0082.JPG");

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    //await BrainPad.Display.PaletteFromBuffer(pixels,3);
    await BrainPad.Display.DrawBuffer(pixels, 4);
}

await demo();

//close serial com
await BrainPad.Disconnect()

console.log("The End!");