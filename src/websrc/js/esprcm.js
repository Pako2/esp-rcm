var version = "";

var websock = null;
var wsUri = "ws://" + window.location.hostname + ":" + window.location.port + "/ws";
var utcSeconds;
var timezone;
var data = [];
var ajaxobj;
var colorDict = JSON.parse('{"green":"#006400","red":"#dc143c","blue":"#00008b"}');
var temperature;
var humidity = 0.0;
var old_hum;

var config = {
    "command": "configfile",
    "network": {
        "bssid": "",
        "ssid": "",
        "pswd": "",
        "dhcp": 1,
        "ip": "",
        "subnet": "",
        "gateway": "",
        "dns": ""
    },
    "hardware": {
        "sensorType": 0,
        "wifipin": 2,
        "cfgpin": 12
    },
    "general": {
        "hostnm": "esp-rcm",
        "restart": 0,
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
        "templimits": "16;24",
        "humlimits": "35;65",
        "roomname": "",
        "tempalarm": "",
        "tempok": "",
        "humalarm": "",
        "humok": ""
    }
};

var page = 1;
var haspages;
var logdata;
var completed = false;
var file = {};
var backupstarted = false;
var restorestarted = false;

var esprcmcontent;

function browserTime() {
    var d = new Date(0);
    var c = new Date();
    var timestamp = Math.floor((c.getTime() / 1000) + ((c.getTimezoneOffset() * 60) * -1));
    d.setUTCSeconds(timestamp);
    document.getElementById("rtc").innerHTML = d.toUTCString().slice(0, -3);
}

function deviceTime() {
    var t = new Date(0); // The 0 there is the key, which sets the date to the epoch,
    var devTime = Math.floor(utcSeconds + ((t.getTimezoneOffset() * 60) * -1));
    t.setUTCSeconds(devTime);
    document.getElementById("utc").innerHTML = t.toUTCString().slice(0, -3);
}

function syncBrowserTime() {
    var d = new Date();
    var timestamp = Math.floor((d.getTime() / 1000));
    var datatosend = {};
    datatosend.command = "settime";
    datatosend.epoch = timestamp;
    websock.send(JSON.stringify(datatosend));
    $("#ntp").click();
}

//function handleSensor() {}


function listhardware() {
    document.getElementById("wifipin").value = config.hardware.wifipin;
    document.getElementById("cfgpin").value = config.hardware.cfgpin;
    document.getElementById("sensorType").value = config.hardware.sensorType;
    //handleSensor();
}

function listlog() {
    websock.send("{\"command\":\"getlatestlog\", \"page\":" + page + "}");
}

function listntp() {
    websock.send("{\"command\":\"gettime\"}");
    document.getElementById("ntpserver").value = config.ntp.server;
    document.getElementById("intervals").value = config.ntp.interval;
    document.getElementById("DropDownTimezone").value = config.ntp.timezone;
    browserTime();
    deviceTime();
}

function listalarms() {
    var kid = '<input type="text" class="js-range-slider0" value="" />'
    var sl1 = $("#slider1");
    if (sl1.children().length > 1) {
        sl1.empty();
        sl1.append(kid.replace('0', '1'));
        $("#slider2").empty();
        $("#slider2").append(kid.replace('0', '2'));
    }
    var tlimits = config.alarm.templimits.split(";");
    var hlimits = config.alarm.humlimits.split(";");
    $(".js-range-slider1").ionRangeSlider({
        skin: "flat",
        type: "double",
        //grid: true,
        min: 0,
        max: 100,
        from: tlimits[0],
        to: tlimits[1]
    });
    $(".js-range-slider2").ionRangeSlider({
        skin: "flat",
        type: "double",
        //rid: true,
        min: 0,
        max: 100,
        from: hlimits[0],
        to: hlimits[1]
    });
    document.getElementById("roomname").value = config.alarm.roomname;
    document.getElementById("tempalarm").value = config.alarm.tempalarm;
    document.getElementById("tempok").value = config.alarm.tempok;
    document.getElementById("humalarm").value = config.alarm.humalarm;
    document.getElementById("humok").value = config.alarm.humok;


}


function revcommit() {
    document.getElementById("jsonholder").innerText = JSON.stringify(config, null, 2);
    $("#revcommit").modal("show");
}

function uncommited() {
    $("#commit").fadeOut(200, function () {
        $(this).css("background", "gold").fadeIn(1000);
    });
    document.getElementById("commit").innerHTML = "<h6>You have uncommited changes, please click here to review and commit.</h6>";
    $("#commit").click(function () {
        revcommit();
        return false;
    });
}

function savehardware() {
    config.hardware.sensorType = parseInt(document.getElementById("sensorType").value);
    config.hardware.wifipin = parseInt(document.getElementById("wifipin").value);
    config.hardware.cfgpin = parseInt(document.getElementById("cfgpin").value);
    uncommited();
}

function saventp() {
    config.ntp.server = document.getElementById("ntpserver").value;
    config.ntp.interval = parseInt(document.getElementById("intervals").value);
    config.ntp.timezone = parseInt(document.getElementById("DropDownTimezone").value);
    uncommited();
}
function savealarms() {
    config.alarm.templimits = $(".js-range-slider1").val();
    config.alarm.humlimits = $(".js-range-slider2").val();
    config.alarm.roomname = document.getElementById("roomname").value;
    config.alarm.tempalarm = document.getElementById("tempalarm").value;
    config.alarm.tempok = document.getElementById("tempok").value;
    config.alarm.humalarm = document.getElementById("humalarm").value;
    config.alarm.humok = document.getElementById("humok").value;
    uncommited();
}

function savegeneral() {
    var a = document.getElementById("adminpwd").value;
    if (a === null || a === "") {
        alert("Administrator Password cannot be empty");
        return;
    }
    config.general.pswd = a;
    config.general.hostnm = document.getElementById("hostname").value;
    config.general.restart = parseInt(document.getElementById("autorestart").value);
    uncommited();
}

function savemqtt() {
    config.mqtt.enabled = 0;
    if (parseInt($("input[name=\"mqttenabled\"]:checked").val()) === 1) {
        config.mqtt.enabled = 1;
    }
    config.mqtt.host = document.getElementById("mqtthost").value;
    config.mqtt.port = parseInt(document.getElementById("mqttport").value);
    config.mqtt.topic = document.getElementById("mqtttopic").value;
    config.mqtt.user = document.getElementById("mqttuser").value;
    config.mqtt.pswd = document.getElementById("mqttpwd").value;
    uncommited();
}

function saveemail() {
    config.email.enabled = 0;
    if (parseInt($("input[name=\"emailenabled\"]:checked").val()) === 1) {
        config.email.enabled = 1;
    }
    config.email.server = document.getElementById("emailserver").value;
    config.email.port = parseInt(document.getElementById("emailport").value);
    config.email.user = document.getElementById("emailuser").value;
    config.email.pswd = document.getElementById("emailpwd").value;
    config.email.address = document.getElementById("emailaddress").value;
    config.email.recipients = readRecipTable();
    uncommited();
}

function sendtestemail() {
    websock.send("{\"command\":\"sendtestemail\"}");
}

function pushtestnotif() {
    websock.send("{\"command\":\"pushtestnotif\"}");
}

function sendtestmessage() {
    websock.send("{\"command\":\"sendtestmessage\"}");
}

function savepushetta() {
    config.pushetta.enabled = 0;
    if (parseInt($("input[name=\"pushettaenabled\"]:checked").val()) === 1) {
        config.pushetta.enabled = 1;
    }
    config.pushetta.server = document.getElementById("pushettaserver").value;
    config.pushetta.port = parseInt(document.getElementById("pushettaport").value);
    config.pushetta.channel = document.getElementById("pushettachannel").value;
    config.pushetta.apikey = document.getElementById("pushettakey").value;
    uncommited();
}

function checkOctects(input) {
    var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    var call = document.getElementById(input);
    if (call.value.match(ipformat)) {
        return true;
    } else {
        alert("You have entered an invalid address on " + input);
        call.focus();
        return false;
    }
}

function savenetwork() {
    config.network.dhcp = 0;
    if (document.getElementById("inputtohide").style.display === "none") {
        var b = document.getElementById("ssid");
        config.network.ssid = b.options[b.selectedIndex].value;
    } else {
        config.network.ssid = document.getElementById("inputtohide").value;
    }
    config.network.bssid = document.getElementById("wifibssid").value;
    if (parseInt(document.querySelector("input[name=\"dhcpenabled\"]:checked").value) === 1) {
        config.network.dhcp = 1;
    } else {
        config.network.dhcp = 0;
        if (!checkOctects("ipaddress")) {
            return;
        }
        if (!checkOctects("subnet")) {
            return;
        }
        if (!checkOctects("dnsadd")) {
            return;
        }
        if (!checkOctects("gateway")) {
            return;
        }
        config.network.ip = document.getElementById("ipaddress").value;
        config.network.dns = document.getElementById("dnsadd").value;
        config.network.subnet = document.getElementById("subnet").value;
        config.network.gateway = document.getElementById("gateway").value;
    }
    config.network.pswd = document.getElementById("wifipass").value;
    uncommited();
}

var formData = new FormData();


function inProgress(callback) {
    $("body").load("esprcm.htm #progresscontent", function (responseTxt, statusTxt, xhr) {
        if (statusTxt === "success") {
            $(".progress").css("height", "40");
            $(".progress").css("font-size", "xx-large");
            var i = 0;
            var prg = setInterval(function () {
                $(".progress-bar").css("width", i + "%").attr("aria-valuenow", i).html(i + "%");
                i++;
                if (i === 101) {
                    clearInterval(prg);
                    var a = document.createElement("a");
                    a.href = "http://" + config.general.hostnm + ".local";
                    a.innerText = "Try to reconnect ESP";
                    document.getElementById("reconnect").appendChild(a);
                    document.getElementById("reconnect").style.display = "block";
                    document.getElementById("updateprog").className = "progress-bar progress-bar-success";
                    document.getElementById("updateprog").innerHTML = "Completed";
                }
            }, 500);
            switch (callback) {
                case "upload":
                    $.ajax({
                        url: "/update",
                        type: "POST",
                        data: formData,
                        processData: false,
                        contentType: false
                    });
                    break;
                case "commit":
                    websock.send(JSON.stringify(config));
                    break;
                case "destroy":
                    websock.send("{\"command\":\"destroy\"}");
                    break;
                case "restart":
                    websock.send("{\"command\":\"restart\"}");
                    break;
                default:
                    break;

            }
        }
    }).hide().fadeIn();
}

function commit() {
    inProgress("commit");
}


function handleDHCP() {
    if (document.querySelector("input[name=\"dhcpenabled\"]:checked").value === "1") {
        $("#staticip2").slideUp();
        $("#staticip1").slideUp();
    } else {
        document.getElementById("ipaddress").value = config.network.ip;
        document.getElementById("subnet").value = config.network.subnet;
        $("#staticip1").slideDown();
        $("#staticip1").show();
        $("#staticip2").slideDown();
        $("#staticip2").show();
    }
}

function handleSTA() {
    document.getElementById("dhcp").style.display = "block";
    if (config.network.dhcp === 0) {
        $("input[name=\"dhcpenabled\"][value=\"0\"]").prop("checked", true);
    }
    handleDHCP();
}

function listnetwork() {
    document.getElementById("inputtohide").value = config.network.ssid;
    document.getElementById("wifipass").value = config.network.pswd;
    document.getElementById("wifibssid").value = config.network.bssid;
    document.getElementById("dnsadd").value = config.network.dns;
    document.getElementById("gateway").value = config.network.gateway;
    handleSTA();
}

function listgeneral() {
    document.getElementById("adminpwd").value = config.general.pswd;
    document.getElementById("hostname").value = config.general.hostnm;
    document.getElementById("autorestart").value = config.general.restart;
}

function listmqtt() {
    if (config.mqtt.enabled === 1) {
        $("input[name=\"mqttenabled\"][value=\"1\"]").prop("checked", true);
    }
    document.getElementById("mqtthost").value = config.mqtt.host;
    document.getElementById("mqttport").value = config.mqtt.port;
    document.getElementById("mqtttopic").value = config.mqtt.topic;
    document.getElementById("mqttuser").value = config.mqtt.user;
    document.getElementById("mqttpwd").value = config.mqtt.pswd;
}

function listemail() {
    if (config.email.enabled === 1) {
        $("input[name=\"emailenabled\"][value=\"1\"]").prop("checked", true);
    }
    document.getElementById("emailserver").value = config.email.server;
    document.getElementById("emailport").value = config.email.port;
    document.getElementById("emailuser").value = config.email.user;
    document.getElementById("emailpwd").value = config.email.pswd;
    document.getElementById("emailaddress").value = config.email.address;
    data = config.email.recipients;
    initRecipTable();
}

function listpushetta() {
    if (config.pushetta.enabled === 1) {
        $("input[name=\"pushettaenabled\"][value=\"1\"]").prop("checked", true);
    }
    document.getElementById("pushettaserver").value = config.pushetta.server;
    document.getElementById("pushettaport").value = config.pushetta.port;
    document.getElementById("pushettachannel").value = config.pushetta.channel;
    document.getElementById("pushettakey").value = config.pushetta.apikey;
}


function listBSSID() {
    var select = document.getElementById("ssid");
    document.getElementById("wifibssid").value = select.options[select.selectedIndex].bssidvalue;
}

function listSSID(obj) {
    var select = document.getElementById("ssid");
    for (var i = 0; i < obj.list.length; i++) {
        var x = parseInt(obj.list[i].rssi);
        var percentage = Math.min(Math.max(2 * (x + 100), 0), 100);
        var opt = document.createElement("option");
        opt.value = obj.list[i].ssid;
        opt.bssidvalue = obj.list[i].bssid;
        opt.innerHTML = "BSSID: " + obj.list[i].bssid + ", Signal Strength: %" + percentage + ", Network: " + obj.list[i].ssid;
        select.appendChild(opt);
    }
    document.getElementById("scanb").innerHTML = "Re-Scan";
    listBSSID();
}

function scanWifi() {
    websock.send("{\"command\":\"scan\"}");
    document.getElementById("scanb").innerHTML = "...";
    document.getElementById("inputtohide").style.display = "none";
    var node = document.getElementById("ssid");
    node.style.display = "inline";
    while (node.hasChildNodes()) {
        node.removeChild(node.lastChild);
    }
}


function getEvents() {
    websock.send("{\"command\":\"geteventlog\", \"page\":" + page + "}");
}


function isVisible(e) {
    return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
}

/* function listSCAN(obj) {
    var elm = document.getElementById("usersbanner");
    if (isVisible(elm))
    {
        if (obj.known === 1) {
            $(".fooicon-remove").click();
            document.querySelector("input.form-control[type=text]").value = obj.uid;
            $(".fooicon-search").click();
        } else {
            $(".footable-add").click();
            document.getElementById("uid").value = obj.uid;
            document.getElementById("picctype").value = obj.type;
            document.getElementById("username").value = obj.user;
            document.getElementById("acctype").value = obj.acctype;
        }
    }
} */

function getnextpage(mode) {
    if (!backupstarted) {
        document.getElementById("loadpages").innerHTML = "Loading " + page + "/" + haspages;
    }
    if (page < haspages) {
        page = page + 1;
        var commandtosend = {};
        commandtosend.command = mode;
        commandtosend.page = page;
        websock.send(JSON.stringify(commandtosend));
    }
}

function builddata(obj) {
    data = data.concat(obj.list);
}

// function testRelay() {
//     websock.send("{\"command\":\"testrelay\"}");
// }

function colorStatusbar(ref) {
    var percentage = ref.style.width.slice(0, -1);
    if (percentage > 50) { ref.className = "progress-bar progress-bar-success"; } else if (percentage > 25) { ref.className = "progress-bar progress-bar-warning"; } else { ref.class = "progress-bar progress-bar-danger"; }
}

function listClimate() {
    var tlimits = config.alarm.templimits.split(";");
    var hlimits = config.alarm.humlimits.split(";");
    initScale(tlimits[0], tlimits[1]);
    //   $(".amount").css("height",0)
    setValue(temperature, tlimits[0], tlimits[1]);
    changeNum(humidity, hlimits[0], hlimits[1]);

}

$.fn.animateRotate = function (startAngle, endAngle, duration, easing, complete) {
    return this.each(function () {
        var elem = $(this);
        $({ deg: startAngle }).animate({ deg: endAngle }, {
            duration: duration,
            easing: easing,
            step: function (now) {
                elem.css({
                    '-moz-transform': 'rotate(' + now + 'deg)',
                    '-webkit-transform': 'rotate(' + now + 'deg)',
                    '-o-transform': 'rotate(' + now + 'deg)',
                    '-ms-transform': 'rotate(' + now + 'deg)',
                    'transform': 'rotate(' + now + 'deg)'
                });
            },
            complete: complete || $.noop
        });
    });
};


function listStats() {
    document.getElementById("chip").innerHTML = ajaxobj.chipid;
    document.getElementById("cpu").innerHTML = ajaxobj.cpu + " Mhz";
    document.getElementById("uptime").innerHTML = ajaxobj.uptime;
    document.getElementById("heap").innerHTML = ajaxobj.heap + " Bytes";
    document.getElementById("heap").style.width = (ajaxobj.heap * 100) / 40960 + "%";
    colorStatusbar(document.getElementById("heap"));
    document.getElementById("flash").innerHTML = ajaxobj.availsize + " Bytes";
    document.getElementById("flash").style.width = (ajaxobj.availsize * 100) / (ajaxobj.availsize + ajaxobj.sketchsize) + "%";
    colorStatusbar(document.getElementById("flash"));
    document.getElementById("spiffs").innerHTML = ajaxobj.availspiffs + " Bytes";
    document.getElementById("spiffs").style.width = (ajaxobj.availspiffs * 100) / ajaxobj.spiffssize + "%";
    colorStatusbar(document.getElementById("spiffs"));
    document.getElementById("ssidstat").innerHTML = ajaxobj.ssid;
    document.getElementById("ip").innerHTML = ajaxobj.ip;
    document.getElementById("gate").innerHTML = ajaxobj.gateway;
    document.getElementById("mask").innerHTML = ajaxobj.netmask;
    document.getElementById("dns").innerHTML = ajaxobj.dns;
    document.getElementById("mac").innerHTML = ajaxobj.mac;
    document.getElementById("sver").innerText = version;
}

function getContent(contentname) {
    $("#dismiss").click();
    $(".overlay").fadeOut().promise().done(function () {
        var content = $(contentname).html();
        $("#ajaxcontent").html(content).promise().done(function () {
            switch (contentname) {
                case "#statuscontent":
                    listStats();
                    break;
                case "#climatecontent":
                    listClimate();
                    break;
                case "#backupcontent":
                    break;
                case "#ntpcontent":
                    listntp();
                    break;
                case "#alarmscontent":
                    listalarms();
                    break;
                case "#mqttcontent":
                    listmqtt();
                    break;
                case "#emailcontent":
                    listemail();
                    break;
                case "#pushettacontent":
                    listpushetta();
                    break;
                case "#generalcontent":
                    listgeneral();
                    break;
                case "#hardwarecontent":
                    listhardware();
                    break;
                case "#networkcontent":
                    listnetwork();
                    break;
                case "#logcontent":
                    page = 1;
                    data = [];
                    listlog();
                    break;
                case "#eventcontent":
                    page = 1;
                    data = [];
                    getEvents();
                    break;
                default:
                    break;
            }
            $("[data-toggle=\"popover\"]").popover({
                container: "body"
            });
            $(this).hide().fadeIn();
        });
    });
}


function backupset() {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    var dlAnchorElem = document.getElementById("downloadSet");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "esp-rcm-settings.json");
    dlAnchorElem.click();
}


function restoreSet() {
    var input = document.getElementById("restoreSet");
    var reader = new FileReader();
    if ("files" in input) {
        if (input.files.length === 0) {
            alert("You did not select file to restore!");
        } else {
            reader.onload = function () {
                var json;
                try {
                    json = JSON.parse(reader.result);
                } catch (e) {
                    alert("Not a valid backup file!");
                    return;
                }
                if (json.command === "configfile") {
                    var x = confirm("File seems to be valid, do you wish to continue?");
                    if (x) {
                        config = json;
                        //templimits = config.alarm.templimits;
                        //humlimits = config.alarm.humlimits;
                        uncommited();
                    }
                }
            };
            reader.readAsText(input.files[0]);
        }
    }
}


function twoDigits(value) {
    if (value < 10) {
        return "0" + value;
    }
    return value;
}

function initEventTable() {
    var newlist = [];
    for (var i = 0; i < data.length; i++) {
        var dup = JSON.parse(data[i]);
        dup.uid = i;
        newlist[i] = {};
        newlist[i].options = {};
        newlist[i].value = {};
        newlist[i].value = dup;
        var c = dup.type;
        switch (c) {
            case "WARN":
                newlist[i].options.classes = "warning";
                break;
            case "INFO":
                newlist[i].options.classes = "info";
                break;
            case "ERRO":
                newlist[i].options.classes = "danger";
                break;
            default:
                break;
        }

    }
    jQuery(function ($) {
        window.FooTable.init("#eventtable", {
            columns: [{
                "name": "uid",
                "title": "ID",
                "type": "text",
                "sorted": true,
                "direction": "DESC"
            },
            {
                "name": "type",
                "title": "Event Type",
                "type": "text"
            },
            {
                "name": "src",
                "title": "Source"
            },
            {
                "name": "desc",
                "title": "Description"
            },
            {
                "name": "data",
                "title": "Additional Data",
                "breakpoints": "xs sm",
                "style": "font-family:monospace"
            },
            {
                "name": "time",
                "title": "Date",
                "parser": function (value) {
                    if (value < 1520665101) {
                        return value;
                    } else {
                        var comp = new Date();
                        value = Math.floor(value + ((comp.getTimezoneOffset() * 60) * -1));
                        var vuepoch = new Date(value * 1000);
                        var formatted = vuepoch.getUTCFullYear() +
                            "-" + twoDigits(vuepoch.getUTCMonth() + 1) +
                            "-" + twoDigits(vuepoch.getUTCDate()) +
                            "-" + twoDigits(vuepoch.getUTCHours()) +
                            ":" + twoDigits(vuepoch.getUTCMinutes()) +
                            ":" + twoDigits(vuepoch.getUTCSeconds());
                        return formatted;
                    }
                },
                "breakpoints": "xs sm"
            }
            ],
            rows: newlist
        });
    });
}

// function initLatestLogTable() {
// var newlist = [];
// for (var i = 0; i < data.length; i++) {
// var dup = JSON.parse(data[i]);
// newlist[i] = {};
// newlist[i].options = {};
// newlist[i].value = {};
// newlist[i].value = dup;
// var c = dup.acctype;
// switch (c) {
// case 1:
// newlist[i].options.classes = "success";
// break;
// case 2:
// newlist[i].options.classes = "warning";
// break;
// case 99:
// newlist[i].options.classes = "info";
// break;
// case 0:
// newlist[i].options.classes = "warning";
// break;
// case 98:
// newlist[i].options.classes = "danger";
// break;
// default:
// break;
// }

// }
// jQuery(function($) {
// window.FooTable.init("#latestlogtable", {
// columns: [{
// "name": "timestamp",
// "title": "Date",
// "parser": function(value) {
// var comp = new Date();
// value = Math.floor(value + ((comp.getTimezoneOffset() * 60) * -1));
// var vuepoch = new Date(value * 1000);
// var formatted = vuepoch.getUTCFullYear() +
// "-" + twoDigits(vuepoch.getUTCMonth() + 1) +
// "-" + twoDigits(vuepoch.getUTCDate()) +
// "-" + twoDigits(vuepoch.getUTCHours()) +
// ":" + twoDigits(vuepoch.getUTCMinutes()) +
// ":" + twoDigits(vuepoch.getUTCSeconds());
// return formatted;
// },
// "sorted": true,
// "direction": "DESC"
// },
// {
// "name": "uid",
// "title": "UID",
// "type": "text",
// "style":"font-family:monospace"
// },
// {
// "name": "username",
// "title": "User Name or Label"
// },
// {
// "name": "acctype",
// "title": "Access",
// "breakpoints": "xs sm",
// "parser": function(value) {
// if (value === 1) {
// return "Granted";
// } else if (value === 99) {
// return "Admin";
// } else if (value === 0) {
// return "Disabled";
// } else if (value === 98) {
// return "Unknown";
// } else if (value === 2) {
// return "Expired";
// }
// }
// }
// ],
// rows: newlist
// });
// });
// }

function initScale(bottlimit, toplimit) {
    $(".range").append('<span class="total" style="bottom: 100%;"><span class="amounttxt"style="font-weight:normal;">50&nbsp;&deg;C</span></span>');
    $(".range").append('<span class="total" style="bottom: ' + (2 * toplimit).toString() + '%"><span class="amounttxt" style="color:#dc143c;">' + toplimit.toString() + '&nbsp;&deg;C</span></span>');
    $(".range").append('<span class="total" style="bottom: ' + (2 * bottlimit).toString() + '%"><span class="amounttxt" style="color:#00008b;">' + bottlimit.toString() + '&nbsp;&deg;C</span></span>');
    $(".range").append('<span class="total" style="bottom: 0%;"><span class="amounttxt"style="font-weight:normal;">0&nbsp;&deg;C</span></span>');
}

function setMediumColor(color) {
    clr = colorDict[color]
    $(".temper_val").css('color', clr);
    $(".thermometer .amount").css('background', clr);
    $(".bulb .circle").css('background', clr);
    $(".bulb .filler").css('background', clr);
}

function setValue(value, bottlimit, toplimit) {
    $("#temper_val").text(value);
    if (value >= bottlimit && value <= toplimit) { setMediumColor("green"); }
    else if (value > toplimit) { setMediumColor("red"); }
    else { setMediumColor("blue"); }
    if (value > 50) { value = 50; }
    $(".amount").animate({ "height": (2 * value).toString() + "%" }, 1500);
}

function setGaugeColor(color, scale) {
    var classList = scale.attr('class').split(/\s+/);
    var colorClass = classList.find(function (value) { return value.startsWith("color-"); });
    scale.removeClass(colorClass).addClass("color-" + color);
    $(".humid_val").css('color', colorDict[color]);
}

function changeNum(nmbr, botthum, tophum) {
    $scale = $(".gauge_scale");
    if (!$scale.length) {
        return;
    }
    if (nmbr >= botthum && nmbr <= tophum) { setGaugeColor("green", $scale); }
    else if (nmbr > tophum) { setGaugeColor("red", $scale); }
    else { setGaugeColor("blue", $scale); }
    var title = $("#humid_val");
    $(".gauge_scale").animateRotate(Math.round((old_hum / 100) * 180), Math.round((nmbr / 100) * 180), 1500, "swing");
    title.text(nmbr);
    /*     var selfStop = setInterval(function(){
            if (currentNumber < nmbr) {
                currentNumber++;
                title.text(currentNumber);
            }   
            else if (currentNumber > nmbr) {
                currentNumber--;
                title.text(currentNumber);
            }
            else {clearInterval(selfStop);} 
        }, 16); */

}

function readRecipTable() {
    var recarr = [];
    var ft = FooTable.get("#reciptable");
    $.each(ft.rows.all, function (i, row) {
        v = row.val();
        values = {
            nickname: v.nickname,
            recaddr: v.recaddr
        };
        recarr.push(values)
    });
    return recarr;
}

function initRecipTable() {
    jQuery(function ($) {
        var $modal = $("#editor-modal"),
            $editor = $("#editor"),
            $editorTitle = $("#editor-title"),
            ft = window.FooTable.init("#reciptable", {
                columns: [{
                    "name": "nickname",
                    "title": "Recipient name",
                    "type": "text",
                },
                {
                    "name": "recaddr",
                    "title": "Recipient e-mail address",
                    "type": "text",
                },
                ],
                rows: data,
                editing: {
                    showText: "<span class=\"fooicon fooicon-pencil\" aria-hidden=\"true\"></span> Edit Recipients",
                    addText: "New Recipient",
                    addRow: function () {
                        $editor[0].reset();
                        $editorTitle.text("Add a new Recipient");
                        $modal.modal("show");
                    },
                    editRow: function (row) {
                        var values = row.val();
                        $editor.find("#nickname").val(values.nickname);
                        $editor.find("#recaddr").val(values.recaddr);
                        $modal.data("row", row);
                        $editorTitle.text("Edit Recipient # " + values.nickname);
                        $modal.modal("show");
                    },
                    deleteRow: function (row) {
                        var nickname = row.value.nickname;
                        if (confirm("This will remove recipient \"" + nickname + "\" from database. Are you sure?")) {
                            var jsontosend = "{\"nickname\":\"" + nickname + "\",\"command\":\"remove\"}";
                            websock.send(jsontosend);
                            row.delete();
                        }
                    }
                },
            });
        $editor.on("submit", function (e) {
            if (this.checkValidity && !this.checkValidity()) {
                return;
            }
            e.preventDefault();
            var row = $modal.data("row"),
                values = {
                    nickname: $editor.find("#nickname").val(),
                    recaddr: $editor.find("#recaddr").val()
                };
            if (row instanceof window.FooTable.Row) {
                row.delete();
                ft.rows.add(values);
            } else {
                ft.rows.add(values);
            }
            $modal.modal("hide");
        });
    });
}

function restartESP() {
    inProgress("restart");
}


var nextIsNotJson = false;

function socketMessageListener(evt) {
    var obj = JSON.parse(evt.data);
    if (obj.hasOwnProperty("command")) {
        switch (obj.command) {
            case "status":
                if (obj.hasOwnProperty("board")) { isOfficialBoard = true; }
                ajaxobj = obj;
                getContent("#statuscontent");
                break;
            case "climate":
                old_hum = humidity;
                temperature = obj.temperature;
                humidity = obj.humidity;
                if (obj.update) { listClimate(); }
                else {
                    version = obj.version;
                    getContent("#climatecontent"); 
                    $("#mainver").text(version);
                }
                break;
            case "eventlist":
                haspages = obj.haspages;
                if (haspages === 0) {
                    document.getElementById("loading-img").style.display = "none";
                    initEventTable();
                    break;
                }
                builddata(obj);
                break;
            // case "latestlist":
            // haspages = obj.haspages;
            // if (haspages === 0) {
            // document.getElementById("loading-img").style.display = "none";
            // initLatestLogTable();
            // break;
            // }
            // builddata(obj);
            // break;
            case "gettime":
                utcSeconds = obj.epoch;
                timezone = obj.timezone;
                deviceTime();
                break;
            case "ssidlist":
                listSSID(obj);
                break;
            case "configfile":
                config = obj;
                break;
            case "confirmation":
                alert(obj.message);
                break;
            default:
                break;
        }
    }
    if (obj.hasOwnProperty("resultof")) {
        switch (obj.resultof) {
            // case "latestlog":
            // if (obj.result === false) {
            // logdata = [];
            // initLatestLogTable();
            // document.getElementById("loading-img").style.display = "none";
            // }
            // break;
            case "eventlist":
                if (page < haspages && obj.result === true) {
                    getnextpage("geteventlog");
                } else if (page === haspages) {
                    initEventTable();
                    document.getElementById("loading-img").style.display = "none";
                }
                break;
            // case "latestlist":
            // if (page < haspages && obj.result === true) {
            // getnextpage("getlatestlog");
            // } else if (page === haspages) {
            // initLatestLogTable();
            // document.getElementById("loading-img").style.display = "none";
            // }
            // break;
            default:
                break;
        }
    }

}

function clearevent() {
    websock.send("{\"command\":\"clearevent\"}");
    $("#eventlog").click();
}

function clearlatest() {
    websock.send("{\"command\":\"clearlatest\"}");
    $("#latestlog").click();
}

function compareDestroy() {
    if (config.general.hostnm === document.getElementById("compare").value) {
        $("#destroybtn").prop("disabled", false);
    } else { $("#destroybtn").prop("disabled", true); }
}

function destroy() {
    inProgress("destroy");
}

$("#dismiss, .overlay").on("click", function () {
    $("#sidebar").removeClass("active");
    $(".overlay").fadeOut();
});

$("#sidebarCollapse").on("click", function () {
    $("#sidebar").addClass("active");
    $(".overlay").fadeIn();
    $(".collapse.in").toggleClass("in");
    $("a[aria-expanded=true]").attr("aria-expanded", "false");
});

$("#status").click(function () {
    websock.send("{\"command\":\"status\"}");
    return false;
});
$("#climate").click(function () {
    websock.send("{\"command\":\"climate\"}");
    return false;
});

$("table").click(function (event) {
    event.stopImmediatePropagation();
    //Do Stuff
});

$("#network").on("click", (function () { getContent("#networkcontent"); return false; }));
$("#hardware").click(function () { getContent("#hardwarecontent"); return false; });
$("#general").click(function () { getContent("#generalcontent"); return false; });
$("#mqtt").click(function () { getContent("#mqttcontent"); return false; });
$("#email").click(function () { getContent("#emailcontent"); return false; });
$("#pushetta").click(function () { getContent("#pushettacontent"); return false; });
$("#ntp").click(function () { getContent("#ntpcontent"); return false; });
$("#alarm").click(function () { getContent("#alarmscontent"); return false; });
$("#latestlog").click(function () { getContent("#logcontent"); return false; });
$("#backup").click(function () { getContent("#backupcontent"); return false; });
$("#reset").click(function () { $("#destroy").modal("show"); return false; });
$("#eventlog").click(function () { getContent("#eventcontent"); return false; });
$(".noimp").on("click", function () {
    $("#noimp").modal("show");
});


var xDown = null;
var yDown = null;

function handleTouchStart(evt) {
    xDown = evt.touches[0].clientX;
    yDown = evt.touches[0].clientY;
}

function handleTouchMove(evt) {
    if (!xDown || !yDown) {
        return;
    }
    var xUp = evt.touches[0].clientX;
    var yUp = evt.touches[0].clientY;
    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;
    if (Math.abs(xDiff) > Math.abs(yDiff)) { /*most significant*/
        if (xDiff > 0) {
            $("#dismiss").click();
        } else {
            $("#sidebarCollapse").click();
            /* right swipe */
        }
    } else {
        if (yDiff > 0) {
            /* up swipe */
        } else {
            /* down swipe */
        }
    }
    /* reset values */
    xDown = null;
    yDown = null;
}

function logout() {
    jQuery.ajax({
        type: "GET",
        url: "/login",
        async: false,
        username: "logmeout",
        password: "logmeout",
    })
        .done(function () {
            // If we don"t get an error, we actually got an error as we expect an 401!
        })
        .fail(function () {
            // We expect to get an 401 Unauthorized error! In this case we are successfully 
            // logged out and we redirect the user.
            document.location = "index.html";
        });
    return false;
}

function connectWS() {
    if (window.location.protocol === "https:") {
        wsUri = "wss://" + window.location.hostname + ":" + window.location.port + "/ws";
    } else if (window.location.protocol === "file:") {
        wsUri = "ws://" + "localhost" + "/ws";
    }
    websock = new WebSocket(wsUri);
    websock.addEventListener("message", socketMessageListener);

    websock.onopen = function (evt) {
        websock.send("{\"command\":\"getconf\"}");
        websock.send("{\"command\":\"climate\"}");
    };
}

function upload() {
    formData.append("bin", $("#binform")[0].files[0]);
    inProgress("upload");
}

function login() {
    if (document.getElementById("password").value === "neo") {
        $("#signin").modal("hide");
        connectWS();
    } else {
        var username = "admin";
        var password = document.getElementById("password").value;
        var url = "/login";
        var xhr = new XMLHttpRequest();
        xhr.open("get", url, true, username, password);
        xhr.onload = function (e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    $("#signin").modal("hide");
                    connectWS();
                } else {
                    alert("Incorrect password!");
                }
            }
        };
        xhr.send(null);
    }
}

function getLatestReleaseInfo() {
    $.getJSON("https://api.github.com/repos/Pako2/esp-rcm/releases/latest").done(function (release) {
        var asset = release.assets[0];
        var downloadCount = 0;
        for (var i = 0; i < release.assets.length; i++) {
            downloadCount += release.assets[i].download_count;
        }
        var oneHour = 60 * 60 * 1000;
        var oneDay = 24 * oneHour;
        var dateDiff = new Date() - new Date(release.published_at);
        var timeAgo;
        if (dateDiff < oneDay) {
            timeAgo = (dateDiff / oneHour).toFixed(1) + " hours ago";
        } else {
            timeAgo = (dateDiff / oneDay).toFixed(1) + " days ago";
        }
        var releaseInfo = release.name + " was updated " + timeAgo + " and downloaded " + downloadCount.toLocaleString() + " times.";
        $("#downloadupdate").attr("href", asset.browser_download_url);
        $("#releasehead").text(releaseInfo);
        $("#releasebody").text(release.body);
        $("#releaseinfo").fadeIn("slow");
        $("#versionhead").text(version);
    }).error(function () { $("#onlineupdate").html("<h5>Couldn't get release info. Are you connected to the Internet?</h5>"); });
}

$("#update").on("shown.bs.modal", function (e) {
    getLatestReleaseInfo();
});

function allowUpload() {
    $("#upbtn").prop("disabled", false);
}

function start() {
    esprcmcontent = document.createElement("div");
    esprcmcontent.id = "mastercontent";
    esprcmcontent.style.display = "none";
    document.body.appendChild(esprcmcontent);
    $("#signin").on("shown.bs.modal", function () {
        $("#password").focus().select();
    });
    $("#mastercontent").load("esprcm.htm", function (responseTxt, statusTxt, xhr) {
        if (statusTxt === "success") {
            $("#signin").modal({ backdrop: "static", keyboard: false });
            $("[data-toggle=\"popover\"]").popover({
                container: "body"
            });
        }
    });
}

document.addEventListener("touchstart", handleTouchStart, false);
document.addEventListener("touchmove", handleTouchMove, false);