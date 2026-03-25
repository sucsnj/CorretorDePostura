#include <Wire.h>
#include <MPU6050.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

MPU6050 mpu;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

int16_t ax = 0;
int16_t ay = 2000;
int16_t az = 10000;

void setup() {
  Serial.begin(9600);
  Wire.begin();

  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("Falha ao inicializar OLED!");
    while(1);
  }

  mpu.initialize();
  if (!mpu.testConnection()) {
    Serial.println("Falha ao conectar com MPU6050!");
    while (1);
  }

  Serial.println("MPU6050 conectado!");
  pinMode(8, OUTPUT);

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0,0);
  display.println("Sistema Postura");
  display.display();
  delay(2000);
}

void loop() {
  float angleX = atan2(ay, az) * 180 / PI;

  Serial.print("Ângulo X: ");
  Serial.println(angleX);

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0,0);
  display.print("Angulo: ");
  display.println(angleX);

  display.setCursor(0,20);
  if (abs(angleX) > 20) {
    digitalWrite(8, HIGH);
    display.println("⚠ Corrija postura!");
    Serial.println("⚠️ Apruma a coluna, seu camarão!");
  } else {
    digitalWrite(8, LOW);
    display.println("Postura ok");
    Serial.println("Postura aceitavel");
  }

  display.display();
  delay(1000);
}
