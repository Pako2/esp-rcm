# ESP RCM - Room Climate Monitor with ESP8266, HTU21D, Si7021, AM2320

Room Climate Monitor system using a cheap sensor HTU21D, SI7021 or AM2320 and Espressif's ESP8266 Microcontroller. 

## Preface
This project is based on a similar [esp-rfid](https://github.com/esprfid/esp-rfid) project by Ömer Şiar Baysal. I have used many done code and also design of html pages because it is very good. It saved me a lot of work.

## Features
### For Users
* Minimal effort for setting up your Room Climate Monitor system, just flash and everything can be configured via Web UI
* Cheap to build and easy to maintain
### For Tinkerers
* Open Source (minimum amount of hardcoded variable, this means more freedom)
* Using WebSocket protocol to exchange data between Hardware and Web Browser
* Data is encoded as JSON object
* MQTT enabled
* Bootstrap, jQuery, FooTables for beautiful Web Pages for both Mobile and Desktop Screens
* Thanks to ESPAsyncWebServer Library communication is Asynchronous

## Getting Started
This project still in its development phase. New features (and also bugs) are introduced often and some functions may become deprecated. Please feel free to comment or give feedback.

* Get the latest release from [here.](https://github.com/Pako2/esp-rcm/releases)
* See [Known Issues](https://github.com/Pako2/esp-rcm#known-issues) before starting right away.
* See [ChangeLog](https://github.com/Pako2/esp-rcm/blob/dev/CHANGELOG.md)

### What You Will Need
### Hardware
* An ESP8266 module or a development board like **WeMos D1 mini** or **NodeMcu 1.0** with at least **32Mbit Flash (equals to 4MBytes)** (ESP32 does not supported for now)
* A HTU21D Module or Si7021 Module or AM2320 module


### Software
#### Using Compiled Binaries
Download compiled binaries from GitHub Releases page
https://github.com/Pako2/esp-rcm/releases
On Windows you can use **"flash.bat"**, it will ask you which COM port that ESP is connected and then flashes it. You can use any flashing tool and do the flashing manually. The flashing process itself has been described at numerous places on Internet.

#### Building With PlatformIO
##### Backend
The build environment is based on [PlatformIO](http://platformio.org). Follow the instructions found here: http://platformio.org/#!/get-started for installing it.

The resulting (built) image(s) can be found in the directory ```/bin``` created during the build process.

##### Frontend
You can not simply edit Web UI files because you will need to convert them to C arrays, which can be done automatically by a gulp script that can be found in tools directory or you can use compiled executables at the same directory as well (for Windows PCs only).

If you want to edit esp-rcm's Web UI you will need (unless using compiled executables):
* NodeJS
* npm (comes with NodeJS installer)
* Gulp (can be installed with npm)

Gulp script also minifies HTML and JS files and compresses (gzip) them. 

In order to test your changes without flashing the firmware you can launch websocket emulator which is included in tools directory.
* You will need to Node JS for websocket emulator.
* Run ```npm update``` to install dependencies
* Run emulator  ```node wserver.js```
* then you will need to launch your browser with CORS disabled:
* ```chrome.exe --args --disable-web-security -–allow-file-access-from-files --user-data-dir="C:\Users\USERNAME"```

Get more information here: https://stackoverflow.com/questions/3102819/disable-same-origin-policy-in-chrome


### Pin Layout

The following table shows the typical pin layout used for connecting readers hardware to ESP:

| Signal    | Sensor | WeMos D1 mini | NodeMcu | Generic     |
|-----------|:------:|:-------------:|:-------:|:-----------:|
| I2C SDA   |  SDA   | D2            | D2      | GPIO-4      |
| I2C SCL   |  SCL   | D1            | D1      | GPIO-5     |
##### Note:
Remember, the I2C bus needs pull-up resistors of 4.7kΩ. On most modules, however, these resistors are already mounted.
### Steps
* First, flash firmware (you can use /bin/flash.bat on Windows) to your ESP either using Arduino IDE or with your favourite flash tool
* (optional) Fire up your serial monitor to get informed
* Search for Wireless Network "esp-rcm-xxxxxx" and connect to it (It should be an open network and does not require password)
* Open your browser and type either "http://192.168.4.1" or "http://esp-rcm.local" (.local needs Bonjour installed on your computer) on address bar.
* Log on to ESP, default password is "admin"
* Go to "Settings" page
* Configure your amazing access control device. Push "Scan" button to join your wireless network, configure hardware and services (NTP, E-mail, Pushetta, MQTT).
* Save settings, when rebooted your ESP will try to join your wireless network.
* Check your new IP address from serial monitor and connect to your ESP again. (You can also connect to "http://esp-rcm.local")
* Congratulations, everything went well, if you encounter any issue feel free to ask help on GitHub.

### Known Issues
* So far, no issue is known
* Please also check [GitHub issues](https://github.com/Pako2/esp-rcm/issues).

## License
The code parts written by ESP-RCM project's authors are licensed under [GNU GPL v.3](https://www.gnu.org/licenses/gpl.html), 3rd party libraries that are used by this project are licensed under different license schemes, please check them out as well.
