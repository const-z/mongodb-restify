"use strict";

var fs = require("fs");
var path = require("path");
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
        let port = this._argPort();
        try {
            var config = JSON.parse(fs.readFileSync(path.join(process.cwd(), filename)));
            this.db = config.db;
            this.server = config.server;
            this.server.port = port ? port : this.server.port;
            this.logger = config.logger;
            require('intel').config(this.logger);
        } catch (e) {
            require('intel').config(this.logger);
            log.error("Error when process", filename, ". Use default config.\n", e);
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

    get logger() {
        return this._logger;
    }

    set logger(value) {
        this._logger = value;
    }

    _argPort() {
        var port = null;
        if (process.argv) {
            for (var i in process.argv) {
                if (process.argv[i].indexOf("--port=") !== -1) {
                    port = process.argv[i].trim().split("--port=")[1];
                    return port;
                }
            }
        }
    }
}

module.exports = Config;