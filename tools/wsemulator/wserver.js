console.log("[ INFO ] Starting ESP-RCM WebSocket Emulation Server");

const WebSocket = require("ws");

console.log("[ INFO ] You can connect to ws://localhost (default port is 80)");

const wss = new WebSocket.Server({
    port: 80
});

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

var networks = {
    "command": "ssidlist",
    "list": [{
            "ssid": "Company's Network",
            "bssid": "4c:f4:39:a1:41",
            "rssi": "-84"
        },
        {
            "ssid": "Home Router",
            "bssid": "8a:e6:63:a8:15",
            "rssi": "-42"
        },
        {
            "ssid": "SSID Shown Here",
            "bssid": "8a:f5:86:c3:12",
            "rssi": "-77"
        },
        {
            "ssid": "Great Wall of WPA",
            "bssid": "9c:f1:90:c5:15",
            "rssi": "-80"
        },
        {
            "ssid": "Not Internet",
            "bssid": "8c:e4:57:c5:16",
            "rssi": "-87"
        }
    ]
}


var eventlog = {
    "command": "eventlist",
    "page": 1,
    "haspages": 1,
    "list": [
        "{ \"type\": \"WARN\", \"src\": \"sys\", \"desc\": \"Event log cleared!\", \"data\": \"\", \"time\": 1520523010 }",
        "{ \"type\": \"WARN\", \"src\": \"sys\", \"desc\": \"Event log cleared!\", \"data\": \"\", \"time\": 1520523010 }",
        "{ \"type\": \"INFO\", \"src\": \"wifi\", \"desc\": \"WiFi is connected\", \"data\": \"SMC\", \"time\": 13 }",
        "{ \"type\": \"INFO\", \"src\": \"sys\", \"desc\": \"System setup completed, running\", \"data\": \"\", \"time\": 13 }",
        "{ \"type\": \"INFO\", \"src\": \"wifi\", \"desc\": \"WiFi is connected\", \"data\": \"SMC\", \"time\": 13 }",
        "{ \"type\": \"INFO\", \"src\": \"sys\", \"desc\": \"System setup completed, running\", \"data\": \"\", \"time\": 13 }",
        "{ \"type\": \"WARN\", \"src\": \"websrv\", \"desc\": \"New login attempt\", \"data\": \"\", \"time\": 1520578744 }",
        "{ \"type\": \"INFO\", \"src\": \"websrv\", \"desc\": \"Login success!\", \"data\": \"\", \"time\": 1520578744 }",
        "{ \"type\": \"INFO\", \"src\": \"wifi\", \"desc\": \"WiFi is connected\", \"data\": \"SMC\", \"time\": 13 }",
        "{ \"type\": \"INFO\", \"src\": \"sys\", \"desc\": \"System setup completed, running\", \"data\": \"\", \"time\": 13 }",
        "{ \"type\": \"WARN\", \"src\": \"websrv\", \"desc\": \"New login attempt\", \"data\": \"\", \"time\": 1520583560 }"
    ]
}

var configfile = {
    "command": "configfile",
    "network": {
        "bssid": "aa:bb:Cc:dd:ee",
        "ssid": "SMC",
        "pswd": "33355555",
        "dhcp": 1,
        "ip": "192.168.44.100",
        "subnet": "255.255.255.0",
        "gateway": "192.168.44.1",
        "dns": "8.8.8.8"
    },
    "hardware": {
        "sensorType": 0,
        "wifipin": 2,
        "cfgpin": 12
    },
    "general": {
        "hostnm": "esp-rcm",
        "restart": 86400,
        "pswd": "admin"
    },
    "mqtt": {
        "enabled": 0,
        "host": "",
        "port": 1883,
        "topic": "",
        "user": "",
        "pswd": ""
    },
    "email": {
        "enabled": 0,
        "server": "",
        "port": 465,
        "user": "",
        "pswd": "",
        "address": "",
        "recipients": []
    },
    "pushetta": {
        "enabled": 0,
        "server": "api.pushetta.com",
        "port": 80,
        "channel": "",
        "apikey": ""
    },
    "ntp": {
        "server": "pool.ntp.org",
        "interval": 30,
        "timezone": 0
    },
    "alarm": {
        "templimits": "12;22",
        "humlimits": "30;60",
        "roomname": "Server Room",
        "tempalarm": "The temperature is outside the specified limits",
        "tempok": "The temperature is back within the specified limits",
        "humalarm": "The humidity is outside the specified limits",
        "humok": "The humidity is back within the specified limits",
    }
};

function remove(uidKey) {
    for (var i = 0; i < users.length; i++) {
        if (users[i].uid === uidKey) {
            console.log("[ INFO ] Removed: " + JSON.stringify(users[i]));
            users.splice(i, 1);
        }
    }
}

function updateuser(obj) {
    for (var i = 0; i < users.length; i++) {
        if (users[i].uid === obj.uid) {
            console.log("[ INFO ] Old User settings: " + JSON.stringify(users[i]));
            users.splice(i, 1);
            break;
        }
    }
    var newdata = {};
    newdata.uid = obj.uid;
    newdata.username = obj.user;
    newdata.acctype = obj.acctype;
    newdata.validuntil = obj.validuntil;
    console.log("[ INFO ] New User settings: " + JSON.stringify(newdata));
    users.push(newdata);
    var res = {
        "command": "result",
        "resultof": "userfile",
        "result": true
    };
    wss.broadcast(res);
}


function sendUserList(page) {
    var datatosend = {};
    datatosend.command = "userlist"
    datatosend.page = page;
    datatosend.haspages = Math.ceil(users.length / 15);
    datatosend.list = [];
    var zero = 0;
    for (var i = ((page - 1) * 15); i < (page * 15); i++) {
        if (typeof users[i] !== "undefined") {
            datatosend.list[zero++] = users[i];
        }
    }
    wss.broadcast(datatosend);
    var res = {
        "command": "result",
        "resultof": "userlist",
        "result": true
    };
    wss.broadcast(res);
}

function sendEventLog() {
    wss.broadcast(eventlog);
    var res = {
        "command": "result",
        "resultof": "eventlist",
        "result": true
    };
    wss.broadcast(res);
}

function sendStatus() {
    var stats = {
        "command": "status",
        "heap": 30000,
        "chipid": "emu413",
        "cpu": "80/160",
        "availsize": 555555,
        "availspiffs": 445555,
        "spiffssize": 888888,
        "uptime": "1 Day 6 Hours",
        "ssid": "emuSSID",
        "dns": "8.8.8.8",
        "mac": "EM:44:11:33:22",
        "ip": "192.168.2.2",
        "gateway": "192.168.2.1",
        "netmask": "255.255.255.0"
    };
    wss.broadcast(stats);
}

function sendClimate() {
    var climate = {
        "command": "climate",
        "temperature": "23.5",
        "humidity": "45.7",
    };
    wss.broadcast(climate);
}

wss.on('connection', function connection(ws) {
    ws.on("error", () => console.log("[ WARN ] WebSocket Error - Assume a client is disconnected."));
    ws.on('message', function incoming(message) {
        var obj = JSON.parse(message);
        console.log("[ INFO ] Got Command: " + obj.command);
        switch (obj.command) {
            case "remove":
                console.log("[ INFO ] Removing " + obj.uid);
                remove(obj.uid);
                break;
            case "configfile":
                configfile = obj;
                console.log("[ INFO ] New configuration file is recieved");
                configfile = obj;
                break;
            case "userlist":
                console.log("[ INFO ] Sending User List, page: " + obj.page);
                sendUserList(obj.page);
                break;
            case "status":
                console.log("[ INFO ] Sending Fake Emulator Status");
                sendStatus();
                break;
            case "climate":
                console.log("[ INFO ] Sending Fake Emulator Climate Status");
                sendClimate();
                break;
            case "userfile":
                console.log("[ INFO ] User Update " + obj.uid);
                updateuser(obj);
                break;
            case "testrelay":
                console.log("[ INFO ] Test relay button");
                process.stderr.write("\007");
                break;
            case "getlatestlog":
                console.log("[ INFO ] Sending latest log file");
                wss.broadcast(latestlog);
                var res = {
                    "command": "result",
                    "resultof": "latestlist",
                    "result": true
                };
                wss.broadcast(res);
                break;
            case "scan":
                console.log("[ INFO ] Sending Fake Wireless Networks");
                wss.broadcast(networks);
                break;
            case "gettime":
                console.log("[ INFO ] Sending time");
                var res = {};
                res.command = "gettime";
                res.epoch = Math.floor((new Date).getTime() / 1000);
                res.timezone = configfile.timezone;
                wss.broadcast(res);
                break;
            case "settime":
                console.log("[ INFO ] Setting time (fake)");
                var res = {};
                res.command = "gettime";
                res.epoch = Math.floor((new Date).getTime() / 1000);
                res.timezone = configfile.timezone;
                wss.broadcast(res);
                break;
            case "getconf":
                console.log("[ INFO ] Sending configuration file (if set any)");
                wss.broadcast(configfile);
                break;
            case "geteventlog":
                console.log("[ INFO ] Sending eventlog");
                sendEventLog();
                break;
            default:
                console.log("[ WARN ] Unknown command ");
                break;
        }
    });
});
