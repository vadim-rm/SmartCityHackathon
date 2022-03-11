// http://arduino.esp8266.com/stable/package_esp8266com_index.json
#define PC_IP "192.168.0.99:3000"

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

WiFiClient wifiClient;

ESP8266WebServer server(80);

const char *ssid = "Redmi Note 10S_EXT";
const char *password = "123456789";

String buffer = "";

void setup()
{
  Serial.begin(115200);
  delay(10);

  WiFi.begin(ssid, password);

  int i = 0;
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(1000);
  }

  //Serial.print(WiFi.localIP());

  server.on("/setTemp", handleTemp);
  server.enableCORS(true);
  server.begin();
}

void handleTemp()
{
  if (server.hasArg("plain") == false)
  {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Max-Age", "10000");
    server.sendHeader("Access-Control-Allow-Methods", "PUT,POST,GET,OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "*");

    server.send(200, "text/plain", "Body not received");
    return;
  }

  String message = "Body received:\n";
  message += server.arg("plain");
  message += "\n";

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Max-Age", "10000");
  server.sendHeader("Access-Control-Allow-Methods", "PUT,POST,GET,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");

  server.send(200, "text/plain", message);
  Serial.print(server.arg("plain") + "E");
  // 25E
}

void loop()
{
  server.handleClient();
  if (Serial.available())
  {
    char c = Serial.read();
    if (c == 'E')
    {
      HTTPClient http;
      // name=John&age=20E
      String address = "http://";
      address += PC_IP;
      address += "/api/setData";

      http.begin(wifiClient, address);

      http.addHeader("Content-Type", "application/x-www-form-urlencoded");
      http.POST(buffer);

      buffer = "";
      Serial.flush();
      http.end();
    }
    else
    {
      buffer += c;
    }
  }
}
