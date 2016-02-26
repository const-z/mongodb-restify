"use strict";

var fs = require("fs");
var mongodb = require("mongodb");

var DEBUGPREFIX = "DEBUG:";

var Config = require('./modules/config');

var config = new Config("/config.json");

var debug = function(text) {
    if (!config.debug) {
        return;
    }  
    if (typeof text === "object") {
        text = JSON.stringify(text);
    } 
    console.log("%s %s", DEBUGPREFIX, text);
}

debug(config);

var DataRest = require('./modules/data-rest');
var dataRest = new DataRest(config);
dataRest.start();

/*
var test = function(i, max) {
var xhr = new XMLHttpRequest();
xhr.open('POST', '_data/db4/collection1', true);
xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
xhr.send("{\"field1\":\"hello\",    \"field2\":\"i'm test\",    \"collection2_id\":{\"name\":\"collection2\"},    \"collection5_id\":{\"name\":\"collection5\",\"collection4_id\":{\"name\":\"collection4\"}},    \"collection3_id\":{\"name\":\"collection3\",\"collection6_id\":{\"name\":\"collection6\"}}}");
xhr.onreadystatechange = function() { // (3)
  if (xhr.readyState != 4) return;

lasttime = +(new Date());
if (i===max) {
    console.log("end",lasttime);
}

}
}

var d = new Date();
console.log("start",+d);
for (var i=0; i<100; i++) {
test(i, 99);
}
*/