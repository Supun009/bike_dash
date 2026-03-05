#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// BLE UUIDs (You can keep these or generate new ones)
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLECharacteristic *pCharacteristic;
bool deviceConnected = false;

// Pins (Same as your original)
const int voltPin = 34;
const int rpmPin = 19;
const int tempPin = 4;

OneWire oneWire(tempPin);
DallasTemperature sensors(&oneWire);

volatile int pulseCount = 0;
unsigned long lastMillis = 0;

void IRAM_ATTR countPulse() {
  pulseCount++;
}

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) { deviceConnected = true; };
    void onDisconnect(BLEServer* pServer) { 
      deviceConnected = false;
      pServer->getAdvertising()->start(); // Restart advertising
    }
};

void setup() {
  Serial.begin(115200);
  sensors.begin();
  pinMode(rpmPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(rpmPin), countPulse, RISING);

  // Initialize BLE
  BLEDevice::init("Bike_Dashboard_BLE");
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();
  
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  // functions that help with iPhone connections issue
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  Serial.println("Waiting for Bluetooth connection...");
}

void loop() {
  if (millis() - lastMillis >= 100) {
    int rpm = pulseCount * 600; // 10 updates/sec * 60 sec = 600 multiplier
    pulseCount = 0;
    
    // Only request temp every 1000ms to avoid blocking for too long
    static unsigned long lastTempRequest = 0;
    static float lastTemp = 0;
    if (millis() - lastTempRequest >= 1000) {
      sensors.requestTemperatures();
      lastTemp = sensors.getTempCByIndex(0);
      lastTempRequest = millis();
    }
    
    float volt = analogRead(voltPin) * (3.3 / 4095.0) * 6.2;

    if (deviceConnected) {
      // Send data as a comma-separated string: "RPM,TEMP,VOLT"
      String data = String(rpm) + "," + String(lastTemp, 1) + "," + String(volt, 1);
      pCharacteristic->setValue(data.c_str());
      pCharacteristic->notify();
    }
    lastMillis = millis();
  }
}
