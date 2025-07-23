import {SerialUSB} from './serialusb.js';
import * as due from './duelink.js';
import { Util } from "./util.js";
//import { createCanvas, loadImage } from 'canvas';

let duelink = new due.DUELinkController(new SerialUSB());
await duelink.Connect();

duelink.ReadTimeout = 100

await duelink.Graphics.Clear(0)
await duelink.Graphics.Text("DUELink", 1, 10, 10)
await duelink.Graphics.Show()

await duelink.Engine.Select(2);
await duelink.Button.Enable(1, true, 1);

while (true) {
    await duelink.Engine.Select(2);
    let x = await duelink.Button.Down(1)
    if (x) {
        await duelink.Engine.Select(3);
        await duelink.Frequency.Write(7, 1000, 50, 0.5);
                
    }

    await Util.sleep(100)
}