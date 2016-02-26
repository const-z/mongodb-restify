"use strict";

var fs = require("fs");

class Config {
    constructor(filename) {
        this.db = { "port": 27017, "host": "localhost" };
        this.server = { "port": 3500, "address": "0.0.0.0" };
        this.debug = false;
        try {
            // "/config.json"
            var config = JSON.parse(fs.readFileSync(process.cwd() + filename));
            this.db = config.db;
            this.server = config.server;
            this.debug = config.debug;
        } catch (e) {
            console.log("No config.json file found. Fall back to default config.");
        }
    }

    get db() {
        return this._db;
    }

    set db(value) {
        this._db = value;
    }

    get server() {
        return this._server;
    }

    set server(value) {
        this._server = value;
    }

    get debug() {
        return this._debug;
    }

    set debug(value) {
        this._debug = value;
    }
}

module.exports = Config;