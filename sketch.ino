#include <Wire.h>
#include <MPU6050.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define LIMITE_POSTURA 20

MPU6050 mpu;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

float referencia = 0;

void setup() {
  Serial.begin(9600);
  Wire.begin();

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("Falha ao inicializar OLED!");
    while (1);
  }

  mpu.initialize();

  if (!mpu.testConnection()) {
    Serial.println("Falha ao conectar com MPU6050!");
    while (1);
  }

  pinMode(8, OUTPUT);

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0, 0);
  display.println("Sistema Postura");
  display.println("Calibrando...");
  display.display();

  delay(2000);

  int16_t ax, ay, az;
  mpu.getAcceleration(&ax, &ay, &az);

  referencia = atan2(
                 ay,
                 sqrt((float)ax * ax + (float)az * az)
               ) * 180.0 / PI;

  Serial.println("MPU6050 conectado!");
  Serial.print("Referencia: ");
  Serial.println(referencia);

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Calibracao OK");
  display.display();

  delay(1500);
}

void loop() {
  int16_t ax, ay, az;

  mpu.getAcceleration(&ax, &ay, &az);

  float angulo = atan2(
                   ay,
                   sqrt((float)ax * ax + (float)az * az)
                 ) * 180.0 / PI;

  float desvio = angulo - referencia;

  Serial.print("AX=");
  Serial.print(ax);

  Serial.print(" AY=");
  Serial.print(ay);

  Serial.print(" AZ=");
  Serial.print(az);

  Serial.print(" | Angulo=");
  Serial.print(angulo);

  Serial.print(" | Desvio=");
  Serial.println(desvio);

  display.clearDisplay();

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("Angulo: ");
  display.println(angulo, 1);

  display.setCursor(0, 15);
  display.print("Desvio: ");
  display.println(desvio, 1);

  display.setCursor(0, 35);

  if (abs(desvio) > LIMITE_POSTURA) {
    digitalWrite(8, HIGH);

    display.println("Corrija postura!");

    Serial.println("Postura incorreta");
  } else {
    digitalWrite(8, LOW);

    display.println("Postura OK");

    Serial.println("Postura aceitavel");
  }

  display.display();

  delay(2000);
}