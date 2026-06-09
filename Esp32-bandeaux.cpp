#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <FastLED.h>

// ==========================================
// CONFIGURATION DES BROCHES (PINOUT)
// ==========================================
// Moteur (Driver type L298N ou similaire)
const int PIN_MOTOR_PWM = 25; // Broche ENA (Vitesse)
const int PIN_MOTOR_IN1 = 26; // Broche IN1 (Direction 1)
const int PIN_MOTOR_IN2 = 27; // Broche IN2 (Direction 2)

// Bandeau LED (NeoPixel / WS2812B)
const int PIN_LED_STRIP = 2;   // Broche de données pour le bandeau
const int NUM_LEDS = 30;       // Nombre de LEDs sur le bandeau
CRGB leds[NUM_LEDS];

// ==========================================
// CONFIGURATION PWM (ESP32)
// ==========================================
const int PWM_FREQ = 5000;
const int PWM_RESOLUTION = 8; // Résolution 8 bits (0-255)
const int PWM_CHANNEL_MOTOR = 0;

// ==========================================
// CONFIGURATION BLUETOOTH (BLE)
// ==========================================
// L'application cherche "Photobooth" ou "ESP32"
#define BLE_NAME "Photobooth ESP32" 
// UUIDs exacts de votre application React (Nordic UART)
#define SERVICE_UUID           "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_UUID_RX "6e400002-b5a3-f393-e0a9-e50e24dcca9e" 

BLEServer *pServer = NULL;
bool deviceConnected = false;

// ==========================================
// VARIABLES D'ÉTAT
// ==========================================
int motorSpeedPercent = 50; 
String motorDirection = "CW"; // "CW" (Horaire) ou "CCW" (Anti-horaire)
bool isRunning = false;
String commandBuffer = "";

// Variables pour l'animation LED
uint8_t ledHue = 0;

// ==========================================
// FONCTIONS DE CONTRÔLE
// ==========================================
void setLedsColor(CRGB color) {
  fill_solid(leds, NUM_LEDS, color);
  FastLED.show();
}

void updateHardware() {
  if (!isRunning) {
    ledcWrite(PWM_CHANNEL_MOTOR, 0); // Arrêter le moteur
    digitalWrite(PIN_MOTOR_IN1, LOW);
    digitalWrite(PIN_MOTOR_IN2, LOW);
    setLedsColor(CRGB::Black); // Éteindre les LEDs
    return;
  }

  // Convertir le pourcentage (0-100) en valeur PWM (0-255)
  int pwmValue = map(motorSpeedPercent, 0, 100, 0, 255);
  ledcWrite(PWM_CHANNEL_MOTOR, pwmValue);

  // Appliquer la direction
  if (motorDirection == "CW") {
    digitalWrite(PIN_MOTOR_IN1, HIGH);
    digitalWrite(PIN_MOTOR_IN2, LOW);
  } else {
    digitalWrite(PIN_MOTOR_IN1, LOW);
    digitalWrite(PIN_MOTOR_IN2, HIGH);
  }
}

void processCommand(String cmd) {
  cmd.trim(); 
  if (cmd.length() == 0) return;

  Serial.println("Commande reçue : " + cmd);

  if (cmd == "START") {
    isRunning = true;
    updateHardware();
  } 
  else if (cmd == "STOP") {
    isRunning = false;
    updateHardware();
  } 
  else if (cmd.startsWith("SPEED:")) {
    motorSpeedPercent = cmd.substring(6).toInt();
    if (motorSpeedPercent < 0) motorSpeedPercent = 0;
    if (motorSpeedPercent > 100) motorSpeedPercent = 100;
    if (isRunning) updateHardware(); // Mise à jour instantanée
  } 
  else if (cmd.startsWith("DIR:")) {
    motorDirection = cmd.substring(4);
    if (isRunning) updateHardware(); // Mise à jour instantanée
  }
}

// ==========================================
// CALLBACKS BLUETOOTH
// ==========================================
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("App connectée via Bluetooth !");
      
      // Animation courte de connexion (Vert)
      setLedsColor(CRGB::Green);
      delay(500);
      setLedsColor(CRGB::Black);
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("App déconnectée.");
      isRunning = false; // Sécurité : on arrête tout
      updateHardware();
      
      // Animation courte de déconnexion (Rouge)
      setLedsColor(CRGB::Red);
      delay(500);
      setLedsColor(CRGB::Black);
      
      pServer->getAdvertising()->start(); // Relancer la visibilité
    }
};

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      std::string rxValue = pCharacteristic->getValue();
      if (rxValue.length() > 0) {
        String cmd = "";
        for (int i = 0; i < rxValue.length(); i++) {
          cmd += rxValue[i];
        }
        processCommand(cmd);
      }
    }
};

// ==========================================
// SETUP & LOOP
// ==========================================
void setup() {
  Serial.begin(115200); // Même vitesse que l'app WebSerial
  Serial.println("Démarrage du Photobooth ESP32...");

  // Configuration des broches moteur
  pinMode(PIN_MOTOR_IN1, OUTPUT);
  pinMode(PIN_MOTOR_IN2, OUTPUT);
  
  // Configuration du PWM pour le moteur
  ledcSetup(PWM_CHANNEL_MOTOR, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(PIN_MOTOR_PWM, PWM_CHANNEL_MOTOR);
  
  // Initialisation du bandeau LED (NeoPixel)
  FastLED.addLeds<WS2812B, PIN_LED_STRIP, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(100); // Luminosité (0-255)
  setLedsColor(CRGB::Black); // Tout éteindre au démarrage
  
  updateHardware();

  // Initialisation du Bluetooth
  BLEDevice::init(BLE_NAME);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);
  BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(
                       CHARACTERISTIC_UUID_RX,
                       BLECharacteristicProperty::WRITE |
                       BLECharacteristicProperty::WRITE_NR
                     );
  pRxCharacteristic->setCallbacks(new MyCallbacks());

  pService->start();
  pServer->getAdvertising()->addServiceUUID(pService->getUUID());
  pServer->getAdvertising()->start();
  Serial.println("Prêt ! En attente de l'app (Bluetooth ou USB)...");
}

void loop() {
  // Lecture des commandes via le câble USB (WebSerial)
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (commandBuffer.length() > 0) {
        processCommand(commandBuffer);
        commandBuffer = "";
      }
    } else {
      commandBuffer += c;
    }
  }

  // Animation LED quand le moteur tourne (Arc-en-ciel)
  if (isRunning) {
    fill_rainbow(leds, NUM_LEDS, ledHue, 7); // Remplit le bandeau d'un arc-en-ciel
    FastLED.show();
    
    // La vitesse de l'animation s'adapte à la vitesse du moteur
    EVERY_N_MILLISECONDS(20) { 
      ledHue += (motorSpeedPercent / 10) + 1; 
    }
  }
  
  delay(5);
}