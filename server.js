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