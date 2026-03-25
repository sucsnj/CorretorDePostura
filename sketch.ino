#include <Wire.h>
#include <MPU6050.h>

MPU6050 mpu1(0x68); // Quadril
MPU6050 mpu2(0x69); // Pescoço

void setup() {
  Serial.begin(9600);
  Wire.begin();

  // Inicializa cada sensor
  mpu1.initialize();
  mpu2.initialize();

  // Testa conexão individualmente
  if (!mpu1.testConnection()) {
    Serial.println("Falha ao conectar com sensor 1 (0x68)!");
    while (1);
  }
  if (!mpu2.testConnection()) {
    Serial.println("Falha ao conectar com sensor 2 (0x69)!");
    while (1);
  }

  Serial.println("Sensores conectados!");
}

void loop() {
  int16_t ax1, ay1, az1;
  int16_t ax2, ay2, az2;

  mpu1.getAcceleration(&ax1, &ay1, &az1);
  mpu2.getAcceleration(&ax2, &ay2, &az2);

  float angle1 = atan2(ay1, az1) * 180 / PI;
  float angle2 = atan2(ay2, az2) * 180 / PI;

  Serial.print("Quadril: "); Serial.println(angle1);
  Serial.print("Pescoço: "); Serial.println(angle2);

  if (abs(angle1) > 20 || abs(angle2) > 20) {
    Serial.println("⚠️ Postura incorreta detectada!");
  } else {
    Serial.println("Postura aceitável");
  }

  delay(1000);
}
