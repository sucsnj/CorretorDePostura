#include <Wire.h>
#include <MPU6050.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#include <WiFi.h>
#include <PubSubClient.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define LIMITE_POSTURA 20
#define LED_PIN 15

MPU6050 mpu;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// Conexão WiFi
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Conexão MQTT
const char* mqtt_server = "industrial.api.ubidots.com";
const int mqtt_port = 1883;
const char* mqtt_user = "BBUS-eDoQW7vcUZsih99Pp4W0i1Tzr9eqRo";
const char* mqtt_pass = "";

WiFiClient espClient;
PubSubClient client(espClient);

float referencia = 0; // Ângulo de referência

// Função para recalibrar o sensor
void recalibrar() {
  int16_t ax, ay, az;

  // Leitura do acelerômetro
  mpu.getAcceleration(&ax, &ay, &az);

  // Calcula o ângulo de referência
  referencia = atan2(
                 ay,
                 sqrt((float)ax * ax + (float)az * az)
               ) * 180.0 / PI;

  Serial.println("Nova calibracao realizada!");
  Serial.print("Referencia: ");
  Serial.println(referencia);
}

// Callback para receber comandos (Ubidots não aceita comandos, então não será usado)
void callback(char* topic, byte* payload, unsigned int length) {

  String mensagem = "";

  for (unsigned int i = 0; i < length; i++) {
    mensagem += (char)payload[i];
  }

  // TESTE NO OLED
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("CMD RECEBIDO:");
  display.println(mensagem);
  display.display();

  delay(2000);

  if (mensagem == "led_on") {
    digitalWrite(LED_PIN, HIGH);
  }

  else if (mensagem == "led_off") {
    digitalWrite(LED_PIN, LOW);
  }

  else if (mensagem == "recalibrar") {
    recalibrar();
  }
}

// Conexão ao MQTT
void conectaMQTT() {

  while (!client.connected()) {

    Serial.println("Conectando MQTT...");

    if (client.connect("ESP32Client", mqtt_user, mqtt_pass)) {

      Serial.println("Conectado ao broker!");

      client.subscribe("/v1.6/devices/posturaesp32/cmd");

    } else {

      Serial.print("Falha MQTT. Codigo: ");
      Serial.println(client.state());

      delay(2000);
    }
  }
}

// Conexão ao WiFi
void conectaWiFi() {

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi conectado!");

  conectaMQTT();
}

// Função de setup
void setup() {

  Serial.begin(9600);

  Wire.begin(21, 22);

  pinMode(LED_PIN, OUTPUT);

  // Configura o servidor MQTT e o callback
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  // Conecta ao WiFi e ao MQTT
  conectaWiFi();

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {

    Serial.println("Falha OLED");

    while (1);
  }

  mpu.initialize();

  if (!mpu.testConnection()) {

    Serial.println("Falha MPU6050");

    while (1);
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0, 0);
  display.println("Sistema Postura");
  display.println("Calibrando...");
  display.display();

  delay(2000);

  // Realiza a calibracao
  recalibrar();

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Calibracao OK");
  display.display();

  delay(1500);
}

// Loop principal
void loop() {

  // Verifica se esta conectado ao MQTT
  if (!client.connected()) {
    conectaMQTT();
  }

  client.loop();

  // Leitura do MPU6050
  int16_t ax, ay, az;

  mpu.getAcceleration(&ax, &ay, &az);

  // Calcula o angulo
  float angulo = atan2(
                   ay,
                   sqrt((float)ax * ax + (float)az * az)
                 ) * 180.0 / PI;

  // Calcula o desvio
  float desvio = angulo - referencia;

  // Verifica se a postura esta correta
  bool posturaOK = abs(desvio) <= LIMITE_POSTURA;

  Serial.print("Angulo: ");
  Serial.print(angulo);

  Serial.print(" | Desvio: ");
  Serial.print(desvio);

  Serial.print(" | Status: ");
  Serial.println(posturaOK ? "OK" : "INCORRETA");

  if (posturaOK) {
    digitalWrite(LED_PIN, LOW);
  } else {
    digitalWrite(LED_PIN, HIGH);
  }

  // Limpa o display
  display.clearDisplay();

  // Configura o tamanho do texto
  display.setTextSize(1);

  // Configura o cursor
  display.setCursor(0, 0);
  display.print("Angulo: ");
  display.println(angulo, 1);

  display.setCursor(0, 15);
  display.print("Desvio: ");
  display.println(desvio, 1);

  display.setCursor(0, 35);

  if (posturaOK) {
    display.println("Postura OK");
  } else {
    display.println("Corrija postura!");
  }

  display.display();

  char payload[200];

  // Cria o payload
  // Variáveis visiveis no Ubidots
  sprintf(
    payload,
    "{\"angulo\": %.2f, \"desvio\": %.2f, \"status\": %d}",
    angulo,
    desvio,
    posturaOK ? 1 : 0
  );

  // Publica no MQTT
  client.publish(
    "/v1.6/devices/posturaesp32",
    payload
  );

  // Delay para não sobrecarregar o ESP32
  delay(1000);
}