# 📐 Sistema de Correção de Postura com MPU6050 + OLED SSD1306

[![Arduino IDE](https://img.shields.io/badge/Arduino-IDE-blue?logo=arduino)](https://www.arduino.cc/en/software)
[![Wokwi](https://img.shields.io/badge/Simulação-Wokwi-green?logo=wokwi)](https://wokwi.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Este projeto apresenta um protótipo de sistema embarcado (**IoT**) desenvolvido em **Arduino** para monitorar a postura do usuário em tempo real.  
Utilizando sensores **MPU6050** (acelerômetro/giroscópio), o sistema calcula o ângulo de inclinação da coluna e emite alertas visuais via **LED** e mensagens em um **display OLED SSD1306**.

---

## 🎯 Objetivo
Promover maior consciência corporal e auxiliar na correção de posturas inadequadas, prevenindo problemas relacionados à má ergonomia — como dores lombares e cervicais — de forma simples, acessível e portátil.

---

## ⚙️ Funcionalidades
- 📊 Leitura dos eixos de aceleração (`ax`, `ay`, `az`) para calcular o ângulo de inclinação.  
- 🎚️ Definição de limites de tolerância para postura aceitável.  
- 💡 Alerta visual via **LED** quando a postura é considerada incorreta.  
- 🖥️ Exibição de mensagens em **OLED SSD1306 (128x64)** para feedback direto ao usuário.  
- 🧪 Possibilidade de simulação de valores fixos ou dinâmicos para testes no [Wokwi](https://wokwi.com/).  
- 🔗 Escalável para múltiplos sensores, permitindo monitoramento em diferentes pontos da coluna (quadril e pescoço, por exemplo).

---

## 🚀 Tecnologias utilizadas
- [Arduino IDE](https://www.arduino.cc/en/software)  
- Biblioteca **Wire** (I²C)  
- Biblioteca **MPU6050**  
- Bibliotecas **Adafruit GFX** e **Adafruit SSD1306**  
- [Simulador Wokwi](https://wokwi.com/)  

---

## 📌 Próximos passos
- ➕ Implementar suporte físico para **dois sensores** (quadril e pescoço) em vestíveis.  
- 🎭 Criar **presets de postura simulada** (ereta, inclinada, “postura de camarão”).  
- 📱 Explorar **integração com aplicativos móveis** para feedback em tempo real.  
- 🔋 Otimizar consumo de energia para uso contínuo em dispositivos vestíveis.  

---

## 📷 Demonstração

![Demonstração do sistema de correção de postura](postura-alerta.gif)

---

## 📄 Licença
Este projeto está sob a licença [MIT](LICENSE).
