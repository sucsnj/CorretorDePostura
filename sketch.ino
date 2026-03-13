#include <Wire.h>
#include <MPU6050.h>

MPU6050 mpu;

void setup() {
  Serial.begin(9600);
  Wire.begin();
  mpu.initialize();

  if (!mpu.testConnection()) {
    Serial.println("Falha ao conectar com MPU6050!");
    while (1);
  }
  Serial.println("MPU6050 conectado!");
  pinMode(8, OUTPUT); // LED no pino 8
}

void loop() {
  // Simulação dinâmica: postura oscilando 
  int16_t ax = 0;
  int16_t ay = 6000 * sin(millis() / 2000.0); // amplitude menor, mais suave 
  int16_t az = 10000 + 2000 * cos(millis() / 3000.0); // varia um pouco o Z também

  // mpu.getAcceleration(&ax, &ay, &az); // pega os valores reais do sensor

  float angleX = atan2(ay, az) * 180 / PI;

  Serial.print("Ângulo X: ");
  Serial.println(angleX);

  if (abs(angleX) > 20) {
    digitalWrite(8, HIGH); // alerta
    Serial.println("⚠️ Apruma a coluna, seu camarão!");
  } else {
    digitalWrite(8, LOW);
  }

  delay(500);
}
