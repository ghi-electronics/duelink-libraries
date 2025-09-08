#include <DUELink.h>

// This example runs on DueDuino

SerialTransport transport(Serial2);
DUELink duelink(transport);

void setup() {
  Serial.begin(9600);

  Serial2.begin(115200);
  duelink.Connect();
 
  const float cfg[1]=  {0x3C};
  float img[10]=  {1, 1, 1, 1, 1, 1, 1, 1, 1, 1};

  duelink.Graphics.Configuration(1, cfg, 1, 128, 64, 1); 


  duelink.Graphics.Clear(0);
  duelink.Graphics.Text("DUELink X1", 1, 0, 0);
  duelink.Graphics.TextS("DUELink x2", 1, 0, 10, 2,2);
  duelink.Graphics.Circle(1, 30, 30, 10);
  duelink.Graphics.Line(1, 0, 40, 50, 40);
  duelink.Graphics.Fill(1, 0, 45, 20, 5);
  duelink.Graphics.DrawImage(img, sizeof(img)/sizeof(float), 0, 55, 5, 2, 0);
  duelink.Graphics.Rect(1, 0, 60, 20, 4);

  duelink.Graphics.Show();

  duelink.System.StatLed(100,100,0);

  duelink.Engine.Select(2);  
  duelink.Button.Enable(1, 0);

}

void loop() {
  
  delay(100);

 duelink.Engine.Select(2);   
  if (duelink.Button.Down(1) == 1) {
    duelink.Engine.Select(3);  
    duelink.Frequency.Write(7, 1000, 50, 0.5);
     
  }
  
              
}