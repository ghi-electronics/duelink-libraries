import { SerialUSB } from "./serialusb.js";
import { DUELinkController } from "./duelink.js";

async function Test() {
  let duelink = new DUELinkController(new SerialUSB());

  await duelink.Connect();

  //   await duelink.Digital.Write(1, 1);

  // Example of how to wait 3 seconds before blinking the LED using a promise
  //   await new Promise((resolve, reject) =>
  //     setTimeout(async () => {
  //       console.log(await duelink.Analog.Read(1));
  //       resolve();
  //     }, 3000)
  //   );

  // Flash the LED  (on for 200ms, off for 800ms, 20 times)

  await duelink.Led.Set(200, 100, 20);

  await duelink.Button.Enable(23, 1);

  await duelink.Digital.Read(1, 2);

  await duelink.Sound.Beep(4, 1000, 1000);

  setInterval(async () => {
    let d = await duelink.Button.Down(23);
    let u = await duelink.Button.Up(23);

    if (d) {
      console.log("Button A down");
    }

    if (u) {
      console.log("Button A up");
    }
    await duelink.Frequency.Write(1, 400, 200, 50);
  }, 2000);
}

Test();
