#include <Wire.h>
#include <MPU6050.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define LED_PIN 8
#define POSTURE_LIMIT_DEGREES 20.0
#define DEVICE_ID "postura-uno"

MPU6050 mpu;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

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

  Serial.println("MPU6050 conectado!");
  pinMode(LED_PIN, OUTPUT);

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Sistema Postura");
  display.display();
  delay(2000);
}

void loop() {
  int16_t ax, ay, az;
  mpu.getAcceleration(&ax, &ay, &az);

  float angleX = atan2(ay, az) * 180 / PI;
  bool postureAlert = abs(angleX) > POSTURE_LIMIT_DEGREES;

  // Uma linha JSON por leitura facilita integrar com broker, app e dashboard.
  Serial.print("{\"deviceId\":\"");
  Serial.print(DEVICE_ID);
  Serial.print("\",\"angleX\":");
  Serial.print(angleX, 2);
  Serial.print(",\"limit\":");
  Serial.print(POSTURE_LIMIT_DEGREES, 1);
  Serial.print(",\"alert\":");
  Serial.print(postureAlert ? "true" : "false");
  Serial.print(",\"status\":\"");
  Serial.print(postureAlert ? "alert" : "ok");
  Serial.println("\"}");

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0, 0);
  display.print("Angulo: ");
  display.println(angleX, 1);

  display.setCursor(0, 20);
  if (postureAlert) {
    digitalWrite(LED_PIN, HIGH);
    display.println("Corrija postura!");
  } else {
    digitalWrite(LED_PIN, LOW);
    display.println("Postura ok");
  }

  display.display();
  delay(1000);
}
