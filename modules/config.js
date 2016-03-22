"use strict";

var fs = require("fs");
var log = require('intel').getLogger("config.js");

class Config {
    constructor(filename) {
        this.db = { "port": 27017, "host": "localhost" };
        this.server = { "port": 3500, "address": "0.0.0.0" };
        this.logger = {
            "formatters": {
                'simple': {
                    'format': '[%(levelname)s] %(message)s',
                    'colorize': true
                },
                'details': {
                    'format': '[%(date)s] %(name)s.%(levelname)s: %(message)s',
                    'strip': true
                }
            },
            "handlers": {
                'terminal': {
                    'class': "intel/handlers/console",
                    'formatter': 'simple',
                    'level': "DEBUG"
                },
                'logfile': {
                    'class': "intel/handlers/file",
                    'level': "DEBUG",
                    'file': 'report.log',
                    'formatter': 'details'
                }
            },
            "loggers": {
                "root": {
                    'handlers': ["terminal", "logfile"],
                    'level': "TRACE",
                    'handleExceptions': true,
                    'exitOnError': false,
                    'propagate': false
                }
            }
        };
        // intel.TRACE // intel.trace()
        // intel.VERBOSE // intel.verbose()
        // intel.DEBUG // intel.debug()
        // intel.INFO // intel.info()
        // intel.WARN // intel.warn()
        // intel.ERROR // intel.error()
        // intel.CRITICAL // intel.critical()
        var lc = JSON.parse(JSON.stringify(this.logger));
        try {
            var config = JSON.parse(fs.readFileSync(process.cwd() + filename));
            this.db = config.db;
            this.server = config.server;
            this.logger = config.logger;
            require('intel').config(lc);
        } catch (e) {
            require('intel').config(lc);
            log.warn("No config.json file found. Use default config");
        }
        log.debug("start with config:", "\ndb =", this.db, "\nlistner =", this.server, "\nlogger =", this.logger);
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

    get logger() {
        return this._logger;
    }

    set logger(value) {
        this._logger = value;
    }
}

module.exports = Config;