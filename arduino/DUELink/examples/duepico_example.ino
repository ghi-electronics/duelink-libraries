#include <DUELink.h>

SerialTransport transport(Serial1);
DUELink due(transport);

void Cmd(char c) {
  const char data[] = {0, c};
  due.I2c.Write(0x3c, data, 0, 2);
}

// the setup function runs once when you press reset or power the board
void setup() {
  // initialize digital pin LED_BUILTIN as an output.
  pinMode(LED_BUILTIN, OUTPUT);
 
  Serial.begin(9600);

  Serial1.begin(115200);
  due.Connect();

  due.System.New();

  due.Digital.Write(9, 1);
  due.I2c.Configuration(1000);
  delay(100);
  float cfg[] = {0x3c};
  due.Graphics.Configuration(GraphicsType::I2c, cfg, 1, 128, 64, 1);
  Cmd(0xAE);Cmd(0x00);Cmd(0x10);
  Cmd(0x40);Cmd(0x81);Cmd(0xCF);
  Cmd(0xA1);Cmd(0xA6);Cmd(0xA8);
  Cmd(0x3F);Cmd(0xD3);Cmd(0x00);
  Cmd(0xD5);Cmd(0x80);Cmd(0xD9);
  Cmd(0xF1);Cmd(0xDA);Cmd(0x12);
  Cmd(0xDB);Cmd(0x40);Cmd(0x8D);
  Cmd(0x14);Cmd(0xAF);Cmd(0xC8);
  Cmd(0x20);Cmd(0x00);Cmd(0x21);
  Cmd(0);Cmd(128-1);
  Cmd(0x22);Cmd(0);Cmd(7);

  const float smiley[] = {
    0,0,1,1,1,1,0,0,
    0,1,1,1,1,1,1,0,
    1,1,0,1,1,0,1,1,
    1,1,1,1,1,1,1,1,
    1,1,0,1,1,0,1,1,
    1,1,1,0,0,0,1,1,
    0,1,1,1,1,1,1,0,
    0,0,1,1,1,1,0,0
  };
  due.System.SetArrayValue("a1", smiley, 0, sizeof(smiley)/sizeof(float));

  const float ping[] = {200,50,300,25};
  due.System.SetArrayValue("a2", ping, 0, sizeof(ping)/sizeof(float));

  due.System.StatLed(100, 100, 10);
}

const int speed = 3;
int r=10, x=64, y=32;
int dx = speed, dy = speed;

// the loop function runs over and over again forever
void loop() {
  due.Graphics.Clear(0);
  due.Graphics.Text("DUELink",1,43,0);
  due.Graphics.DrawImage("a1",-1,x-4,y-4,8,8,1);
  due.Graphics.Circle(1,x,y,r);
  due.Graphics.Show();
  if (x-speed <= r || x+speed >= 127-r) {
    dx=-dx;
    due.Sound.MelodyPlay(11, "a2", -1);      
  }

  if (y-speed <= r || y+speed >= 63-r) {
    dy=-dy;
    due.Sound.MelodyPlay(11, "a2", -1);
  }
  x += dx;
  y += dy;
}