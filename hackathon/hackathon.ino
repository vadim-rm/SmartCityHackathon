#include <DHT.h>
#include <Servo.h>
#include <Wire.h>
#include <SPI.h>

#include <Adafruit_PN532.h>
#include <TroykaOLED.h>
#include <TroykaCurrent.h>
#include <SoftwareSerial.h>

// https://github.com/amperka/TroykaLight
#include <TroykaLight.h>

uint8_t cardId[4] = {0x89, 0x54, 0xA8, 0x99};

#define TEST_HEATER_AND_COOLER false

#define PIR_PIN 12
#define COOLER_PIN 11
#define HEATER_PIN 10
#define RFID_TRIG_PIN 9
#define SERVO_PIN 8
#define DHT_PIN 7
#define BUTTON_PIN 6

#define wifi Serial1

#define CURRENT_SENSOR_PIN A1
#define LIGHT_SENSOR_PIN A0

bool doorOpened = false;
bool humanInRoom = false;
bool isHeating = false;
bool isCooling = false;
bool prevButtonPressed = false;
bool openedWithWrongCard = false;

float temperature, humidity, consumption, illumination;
float prevTemperature = -100;
float prevHumidity = -100;

int targetTemp = 25;
bool showSet = false;
unsigned int lastUpdateTime = 0;
unsigned int lastOpenTime = 0;
unsigned int lastOpenedWithWrongCard = 0;

DHT dht(DHT_PIN, DHT11);
Adafruit_PN532 nfc(RFID_TRIG_PIN, 100);
TroykaLight sensorLight(LIGHT_SENSOR_PIN);
TroykaOLED display(0x3C);
ACS712 sensorCurrent(CURRENT_SENSOR_PIN);
Servo lock;

void setup()
{
  pinMode(PIR_PIN, INPUT);
  pinMode(COOLER_PIN, OUTPUT);
  pinMode(HEATER_PIN, OUTPUT);

  pinMode(SERVO_PIN, OUTPUT);
  pinMode(DHT_PIN, INPUT);
  pinMode(BUTTON_PIN, INPUT);

  digitalWrite(COOLER_PIN, 0);
  digitalWrite(HEATER_PIN, 0);
  Serial.begin(115200);
  wifi.begin(115200);

  initNFC();
  dht.begin();
  lock.attach(SERVO_PIN);

  display.begin();
}

void showTempOnOLED()
{
  display.clearDisplay();
  display.setFont(font6x8);

  display.print("Temperature: " + String(temperature, 1) + "C", OLED_CENTER, 15);
  display.print("Humidity: " + String(humidity, 1) + "%", OLED_CENTER, 30);
}

void showTargetTempOnOLED()
{
  display.clearDisplay();
  display.setFont(font6x8);

  display.print("Set temperature:", OLED_CENTER, 15);
  display.print(targetTemp, OLED_CENTER, 30);
}

void checkNfc()
{
  uint8_t success;
  // буфер для хранения ID карты
  uint8_t uid[8];
  // размер буфера карты
  uint8_t uidLength;
  // слушаем новые метки
  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength);

  if (success)
  {
    bool ok = true;
    if (uidLength == 4)
    {
      for (int i = 0; i < 4; i++)
      {
        if (cardId[i] != uid[i]) ok = false;
      }
    }

    if (ok) {
      setDoor(true);
    } else {
      lastOpenedWithWrongCard = millis();
      openedWithWrongCard = true;
    }
    
    Serial.println("Found a card");
    Serial.print("ID Length: ");
    Serial.print(uidLength, DEC);
    Serial.println(" bytes");
    Serial.print("ID Value: ");
    nfc.PrintHex(uid, uidLength);
    Serial.println("");
  }
}

void initNFC()
{
  pinMode(RFID_TRIG_PIN, INPUT);
  nfc.begin();
  
  if (!nfc.getFirmwareVersion())
  {
    Serial.print("Didn't find RFID/NFC reader");
    while (1)
    {
    }
  }

  Serial.println("Found RFID/NFC reader");
  nfc.setPassiveActivationRetries(0x11);
  nfc.SAMConfig();
}

void setDoor(bool opened)
{
  if (opened && !doorOpened)
  {
    lastOpenTime = millis();
    lock.write(0);
  }
  else if (!opened && doorOpened)
  {
    lock.write(180);
  }
  doorOpened = opened;
}

void controlTemp()
{
  if (temperature > targetTemp)
  {
    isCooling = true;
    digitalWrite(COOLER_PIN, 1);
  }
  else
  {
    isCooling = false;
    digitalWrite(COOLER_PIN, 0);
  }

  if (temperature < targetTemp)
  {
    isHeating = true;
    digitalWrite(HEATER_PIN, 1);
  }
  else
  {
    isHeating = false;
    digitalWrite(HEATER_PIN, 0);
  }
}

float getIllumination()
{
  sensorLight.read();
  return sensorLight.getLightLux();
}

void sendData()
{
  String data = "";

  data += "temperature=" + String(temperature, 1);
  data += "&humidity=" + String(humidity, 1);
  data += "&consumption=" + String(consumption, 0);
  data += "&illumination=" + String(illumination, 0);
  data += "&isHeating=" + String(isHeating);
  data += "&isCooling=" + String(isCooling);
  data += "&humanInRoom=" + String(humanInRoom);
  data += "&doorOpened=" + String(doorOpened);
  data += "&targetTemp=" + String(targetTemp);
  data += "&openedWithWrongCard=" + String(openedWithWrongCard);
  data += "E";

  //Serial.println(data);
  wifi.print(data);
  lastUpdateTime = millis();
}

String buffer = "";

void loop()
{
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  consumption = pow(sensorCurrent.readCurrentDC(), 2) * 10;
  illumination = getIllumination();
  humanInRoom = digitalRead(PIR_PIN);

  bool buttonPressed = !digitalRead(BUTTON_PIN);
  if (!prevButtonPressed && buttonPressed) {
    showTargetTempOnOLED();
    showSet = true;
  }

  if (prevButtonPressed && !buttonPressed) {
    showSet = false;
  }

  if (!showSet) {
    if (temperature != prevTemperature || humidity != prevHumidity) {
      showTempOnOLED();
    }
  }

  prevTemperature = temperature;
  prevHumidity = humidity;
  prevButtonPressed = buttonPressed;

  controlTemp();
  checkNfc();

  if (wifi.available())
  {
    char c = wifi.read();

    if (c == 'E')
    {
      targetTemp = buffer.toInt();
      buffer = "";
      wifi.flush();
    }
    else
    {
      buffer += c;
    }
  }

  if (millis() - lastUpdateTime > 3 * 1000) {
    sendData();    
  }

  if (millis() - lastOpenTime > 3 * 1000 && doorOpened) {
    setDoor(false);
  }

  if (millis() - lastOpenedWithWrongCard > 10 * 1000) {
    openedWithWrongCard = false;
  }
}
