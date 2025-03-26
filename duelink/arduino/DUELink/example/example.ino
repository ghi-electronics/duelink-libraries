#include "DUELink.h"


TwoWireTransport transport(Wire1);

DUELink duelink(transport);

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  Wire1.begin();


  duelink.Connect();
  duelink.Led.Set(100, 100, 10);

}

int cnt = 0;

void loop() {
  // put your main code here, to run repeatedly:
  //Serial.println(due.dread(1,0));
  Serial.println("delay:");
  Serial.println(cnt);
  cnt++;
  delay(1000);
  
 
}
