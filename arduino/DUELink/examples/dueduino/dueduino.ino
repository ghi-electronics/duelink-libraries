#include <DUELink.h>

// This example runs on DueDuino

SerialTransport transport(Serial2);
DUELink duelink(transport);

void setup() {
  Serial.begin(9600);

  Serial2.begin(115200);
  duelink.Connect();
  duelink.Engine.Select(1);

  duelink.Graphics.Clear(1);
  duelink.Graphics.Text("--DUELink basic--", 0, 10, 1);
  duelink.Graphics.Text("Press button on", 0, 1, 21);
  duelink.Graphics.Text("device 2 to play", 0, 1, 31);
  duelink.Graphics.Text("sound on device 3", 0, 1, 41);
  duelink.Graphics.Show();

  duelink.Engine.Select(2);  
  duelink.Button.Enable(1, 1, 1);

}

void loop() {
  
  delay(100);

  duelink.Engine.Select(2);   
  if (duelink.Button.Up(1) == 1) {
    duelink.Engine.Select(3);  
    duelink.Frequency.Write(7, 1000, 50, 0.5);
     
  }
              
}