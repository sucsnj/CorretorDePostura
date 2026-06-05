# Sistema de Correção de Postura com ESP32, MPU6050 e Ubidots

Projeto acadêmico desenvolvido para monitoramento de postura corporal em tempo real utilizando um ESP32, um sensor MPU6050 e a plataforma Ubidots STEM.

O sistema coleta dados de inclinação corporal, calcula o desvio em relação a uma posição de referência calibrada e disponibiliza as informações em um dashboard web para acompanhamento remoto.

## Funcionalidades

* Leitura contínua dos dados do MPU6050.
* Calibração automática da postura de referência.
* Cálculo do ângulo de inclinação.
* Cálculo do desvio em relação à postura correta.
* Alerta visual através de LED quando o limite configurado é excedido.
* Exibição local das informações em um display OLED SSD1306.
* Envio dos dados para o Ubidots via MQTT.
* Armazenamento histórico em MongoDB Atlas.
* Dashboard web responsivo para monitoramento em tempo real.
* Atualização automática utilizando WebSockets.

## Arquitetura do Sistema

```text
MPU6050
   │
   ▼
ESP32
   │
   ├── OLED SSD1306
   ├── LED de alerta
   │
   ▼
Ubidots STEM (MQTT)
   │
   ▼
Backend Node.js + Express
   │
   ├── MongoDB Atlas
   └── Socket.IO
   │
   ▼
Frontend React + Vite
```

## Hardware Utilizado

* ESP32
* MPU6050
* Display OLED SSD1306 128x64
* LED indicador
* Resistor de 220 Ω
* Jumpers

## Bibliotecas Utilizadas no ESP32

* WiFi
* PubSubClient
* Wire
* MPU6050
* Adafruit GFX Library
* Adafruit SSD1306

## Variáveis Publicadas no Ubidots

Dispositivo:

```text
posturaesp32
```

Variáveis:

```text
angulo
desvio
status
```

### Descrição das Variáveis

| Variável | Descrição                                               |
| -------- | ------------------------------------------------------- |
| angulo   | Ângulo calculado pelo MPU6050                           |
| desvio   | Diferença entre o ângulo atual e a referência calibrada |
| status   | Estado da postura (1 = correta, 0 = incorreta)          |

## Backend

O backend foi desenvolvido utilizando:

* Node.js
* TypeScript
* Express
* Socket.IO
* MongoDB Atlas
* Mongoose

### Variáveis de Ambiente

Arquivo `.env`:

```env
PORT=5000

UBIDOTS_TOKEN=SEU_TOKEN

MONGO_URI=sua_uri_mongodb

ADMIN_PASSWORD=sua_senha

JWT_SECRET=sua_chave_jwt

FRONTEND_URL=https://seu-frontend.netlify.app
```

### Executando Localmente

```bash
npm install
npm run dev
```

### Build para Produção

```bash
npm run build
npm start
```

## Frontend

O frontend foi desenvolvido utilizando:

* React
* TypeScript
* Vite
* Recharts
* Socket.IO Client

### Variáveis de Ambiente

Arquivo `.env`:

```env
VITE_API_URL=https://seu-backend.onrender.com
```

### Executando Localmente

```bash
npm install
npm run dev
```

### Build para Produção

```bash
npm run build
```

## Deploy

### Backend

Escolha uma plataforma para hospedar o backend:

- Render (preferencial)
- Heroku
- Railway
- Vercel

### Frontend

Escolha uma plataforma para hospedar o frontend:

- Netlify (preferencial)
- Vercel
- Render

## Endpoint de Diagnóstico

Verificação da saúde da aplicação:

```http
GET /health
```

Exemplo de resposta:

```json
{
  "status": "ok",
  "mongodb": true,
  "ubidots": true
}
```

## Objetivo

Este projeto tem como objetivo auxiliar na conscientização postural através da coleta, armazenamento e visualização de dados de inclinação corporal, permitindo o acompanhamento em tempo real e a análise histórica das leituras.

## Gif de demonstração

![Demonstracao](postura-alerta.gif)

## Licença

Este projeto está licenciado sob a licença MIT.
