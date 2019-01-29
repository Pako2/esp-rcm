/*
GNU GPL v.3 License

Copyright (c) 2018 Luboš Rückl
Based on esp-rfid https://github.com/esprfid/esp-rfid by Ömer Şiar Baysal

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

#define VERSION "0.1.3"

#include "Arduino.h"
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ESP8266mDNS.h>
#include <ArduinoJson.h>
#include <FS.h>
#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <TimeLib.h>
#include <Ticker.h>
#include "Ntp.h"
#include <AsyncMqttClient.h>
#include "ESP8266SMTPClient.h"
#include <Wire.h>
#include <HTU21D.h>
#include <AM2320.h>

#define DEBUG

// these are from vendors
#include "webh/glyphicons-halflings-regular.woff.gz.h"
#include "webh/glyphicons-halflings-regular.woff2.gz.h"
#include "webh/required.css.gz.h"
#include "webh/required.js.gz.h"

// these are from us which can be updated and changed
#include "webh/esprcm.js.gz.h"
#include "webh/esprcm.css.gz.h"
#include "webh/esprcm.htm.gz.h"
#include "webh/index.html.gz.h"

#ifdef ESP8266
extern "C"
{
#include "user_interface.h"
}
#endif

HTU21D myHTU21D(HTU21D_RES_RH12_TEMP14);
AM2320 myAM2320;
NtpClient NTP;
AsyncMqttClient mqttClient;
Ticker mqttReconnectTimer;
static SMTPClient *smtp;
static AsyncClient *aClient = NULL;
WiFiEventHandler wifiDisconnectHandler, wifiConnectHandler;

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

unsigned long blink_ = millis();
unsigned long now_;
bool updateflag = false;
bool wifiFlag = false;
uint8_t configMode = 0;
uint8_t wifipin = 255;
uint8_t forceAPpin = 255;
uint8_t sensortype = 0;

// Holds the current button state.
volatile uint8_t btnState = 1;
// Holds the last time debounce was evaluated (in millis).
volatile uint32_t lastDebounceTime = 0;
// The delay threshold for debounce checking.
const uint8_t debounceDelay = 50;


//static const uint8_t SDA_PIN = 13; //D7
//static const uint8_t SCL_PIN = 14; //D5
static const uint8_t SDA_PIN = 4; //D2
static const uint8_t SCL_PIN = 5; //D1
static const uint8_t MAX_RETRIES = 3;
bool sensorok = false;
bool forceAPmode = false;
#define LEDoff HIGH
#define LEDon LOW

// Variables for whole scope
const char *http_username = "admin";
char *http_pass = NULL;
unsigned long previousMillis = 0;
unsigned long previousLoopMillis = 0;
unsigned long currentMillis = 0;
unsigned long cooldown = 0;
unsigned long deltaTime = 0;
unsigned long uptime = 0;
bool shouldReboot = false;
bool inAPMode = false; // 333333333333333333333333333333333333333333333
bool isWifiConnected = false;
unsigned long autoRestartIntervalSeconds = 0;

bool timerequest = false;
bool formatreq = false;
char *deviceHostname = NULL;

int mqttenabled = 0;
char *mqttTopic = NULL;
char *mhs = NULL;
char *muser = NULL;
char *mpas = NULL;
int mport;

uint8_t emailenabled = 0;
char *smtpServer = NULL;
int smtpport;
char *emuser = NULL;
char *empas = NULL;
char *emaddr = NULL;
char *pushserver = NULL;
int pushport;
char *pushchannel = NULL;
char *pushapikey = NULL;
char *recipients = NULL;
float tmp = 0;
float hmd = 0;
time_t alarmtime;

typedef enum
{
	REL_UNDER = 2,
	REL_OK = 4,
	REL_OVER = 8
} relation;
typedef struct
{
	float value;
	int toplimit;
	int bottlimit;
	relation stable;
	relation tendency;
	uint8_t counter;
	bool alarm;
} reg;
reg temperature = {0, 24, 16, REL_OK, REL_OK, 0, false};
reg humidity = {0, 65, 35, REL_OK, REL_OK, 0, false};
char *roomname = NULL;
char *tempalarm = NULL;
char *tempok = NULL;
char *humalarm = NULL;
char *humok = NULL;

uint8_t emailkind = 0;
uint8_t pushettaenabled = 0;
uint8_t pushettakind = 0;
char request[512];
char failed[] = "The Pushetta notification sending failed ";
uint8_t mqttkind = 0;
int timeZone;

unsigned long nextbeat = 0;
unsigned long interval = 60;
//unsigned long interval = 180;

#include "log.esp"
#include "helpers.esp"
#include "wsResponses.esp"
#include "email.esp"
#include "pushetta.esp"
#include "mqtt.esp"
#include "sensors.esp"
#include "wifi.esp"
#include "config.esp"
#include "websocket.esp"
#include "webserver.esp"

void ICACHE_FLASH_ATTR setup()
{

#ifdef DEBUG
	Serial.begin(115200);
	Serial.println();

	Serial.print(F("[ INFO ] ESP RCM v"));
	Serial.println(VERSION);

	uint32_t realSize = ESP.getFlashChipRealSize();
	uint32_t ideSize = ESP.getFlashChipSize();
	FlashMode_t ideMode = ESP.getFlashChipMode();
	Serial.printf("Flash real id:   %08X\r\n", ESP.getFlashChipId());
	Serial.printf("Flash real size: %u\n\r\n", realSize);
	Serial.printf("Flash ide  size: %u\r\n", ideSize);
	Serial.printf("Flash ide speed: %u\r\n", ESP.getFlashChipSpeed());
	Serial.printf("Flash ide mode:  %s\r\n", (ideMode == FM_QIO ? "QIO" : ideMode == FM_QOUT ? "QOUT" : ideMode == FM_DIO ? "DIO" : ideMode == FM_DOUT ? "DOUT" : "UNKNOWN"));
	if (ideSize != realSize)
	{
		Serial.println(F("Flash Chip configuration wrong!\r\n"));
	}
	else
	{
		Serial.println(F("Flash Chip configuration ok.\r\n"));
	}
#endif

	if (!SPIFFS.begin())
	{
#ifdef DEBUG
		Serial.print(F("[ WARN ] Formatting filesystem..."));
#endif
		if (SPIFFS.format())
		{
			writeEvent("WARN", "sys", "Filesystem formatted", "");

#ifdef DEBUG
			Serial.println(F(" completed!"));
#endif
		}
		else
		{
#ifdef DEBUG
			Serial.println(F(" failed!"));
			Serial.println(F("[ WARN ] Could not format filesystem!"));
#endif
		}
	}
	wifiDisconnectHandler = WiFi.onStationModeDisconnected(onWifiDisconnect);
	wifiConnectHandler = WiFi.onStationModeConnected(onWifiConnect);
	configMode = loadConfiguration();
	if (configMode < 2)
	{
		fallbacktoAPMode();
	}
	setupWebServer();
	writeEvent("INFO", "sys", "System setup completed, running", "");
}

void ICACHE_RAM_ATTR loop()
{
	now_ = (unsigned)now();
	currentMillis = millis();
	deltaTime = currentMillis - previousLoopMillis;
	uptime = NTP.getUptimeSec();
	previousLoopMillis = currentMillis;

	if (!updateflag)
	{
		if (wifipin != 255)
		{
			if (configMode == 2)
			{
				if (!wifiFlag)
				{
					if ((currentMillis - blink_) > 500)
					{
						blink_ = currentMillis;
						digitalWrite(wifipin, !digitalRead(wifipin));
					}
				}
				else
				{
					if (!(digitalRead(wifipin) == LEDon))
						digitalWrite(wifipin, LEDon);
				}
			}
			else
			{
				if (!(digitalRead(wifipin) == LEDon))
					digitalWrite(wifipin, LEDon);
			}
		}
		if (now_ >= nextbeat)
		{
			if ((now_ - nextbeat) > interval)
				nextbeat = now_ + interval;
			else
				nextbeat += interval;
			if (wifiFlag && mqttenabled && !mqttClient.connected())
			{
				connectToMqtt();
			}
#ifdef DEBUG
			Serial.print(F("[ INFO ] Nextbeat = "));
			Serial.println(getLocalTimeString(nextbeat));
#endif
			if (sensortype == 0)
			{
				if (sensorok) //ToDo - other sensors !!!
				{
					tmp = myHTU21D.readTemperature();
					hmd = myHTU21D.readCompensatedHumidity(tmp);
				}
			}
			else if (sensortype == 1)
			{
				if (sensorok) //ToDo - other sensors !!!
				{
					hmd = myHTU21D.readHumidity();
					tmp = myHTU21D.readTemperature(SI70xx_TEMP_READ_AFTER_RH_MEASURMENT);
				}
			}
			else if (sensortype == 2)
			{
				if (sensorok)
				{
					if (myAM2320.measure())
					{
						tmp = myAM2320.getTemperature();
						hmd = myAM2320.getHumidity();
					}
					else
					{ // error has occured
#ifdef DEBUG

						int errorCode = myAM2320.getErrorCode();
						switch (errorCode)
						{
						case 1:
							Serial.println(F("[ WARN ] Sensor AM2320 is offline"));
							break;
						case 2:
							Serial.println(F("[ WARN ] Sensor AM2320 - CRC validation failed."));
							break;
						}
#endif
					}
				}
			}
			if (tmp > 99.9)
				tmp = 99.9;
			if (hmd > 99.9)
				hmd = 99.9;
			uint8_t diff = procval(&temperature, tmp);
			diff += procval(&humidity, hmd);
			if (diff > 0)
			{
#ifdef DEBUG
				Serial.print(F("[ INFO ] Temperature, humidity = "));
				Serial.print(tmp, 1);
				Serial.print(F(", "));
				Serial.println(hmd, 1);
#endif
				sendClimate(true);
			}
			uint8_t knd = 0;
			if (temperature.alarm)
			{
				knd = temperature.stable;
				temperature.alarm = false;
			}
			if (humidity.alarm)
			{
				knd += 8 * humidity.stable;
				humidity.alarm = false;
			}
			if (knd > 0)
			{
				//process alarm
				alarmtime = now();
				emailkind = knd;
			}
			else if (wifiFlag)
			{
				mqtt_beat();
			}
		}
		if (wifiFlag)
		{
			if (mqttkind > 0)
			{
				mqtt_publish_climate();
			}
			if (pushettakind > 0)
			{
				postPushetta();
			}
			if (emailkind > 0)
			{
				sendEmail();
			}
		}
		if (autoRestartIntervalSeconds > 0 && uptime > autoRestartIntervalSeconds * 1000)
		{
			writeEvent("INFO", "sys", "System is going to reboot", "");
#ifdef DEBUG
			Serial.println(F("[ WARN ] Auto restarting..."));
#endif

			shouldReboot = true;
		}
	}
	if (formatreq)
	{
#ifdef DEBUG
		Serial.println(F("[ WARN ] Factory reset initiated..."));
#endif
		SPIFFS.end();
		ws.enable(false);
		SPIFFS.format();
		ESP.restart();
	}

	if (timerequest)
	{
		timerequest = false;
		sendTime();
	}

	if (shouldReboot)
	{
		writeEvent("INFO", "sys", "System is going to reboot", "");
#ifdef DEBUG
		Serial.println(F("[ INFO ] Rebooting..."));
#endif
		ESP.restart();
	}
}
