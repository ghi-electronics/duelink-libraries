#include <DUELink.h>
#include <DUELinkLib.h>

DUELink due;
TwoWireTransport transport(Wire1);

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  Wire1.begin();
  due.begin(transport);
  due.btnEnable(1, true);
}

void loop() {
  // put your main code here, to run repeatedly:
  Serial.println(due.btnDown(1));
}
