"use strict";

var fs = require("fs");
var mongodb = require("mongodb");
var restify = require("restify");
var querystring = require("querystring");
var log = require('intel').getLogger("server.js");
var DataRest = require('./modules/data-rest');
var Config = require('./modules/config');

////////////////////////////////////////////////

var config = new Config("/config.json");

log.debug("start with config:", config);

var dataRest = new DataRest(config);

var server = restify.createServer({
    name: "mongodb-restify"
});

server.acceptable = ["application/json"];
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
server.use(restify.fullResponse());
server.use(restify.queryParser());
server.use(restify.jsonp());

let read = (req, res) => {
    log.debug(req.method, req.url);
    dataRest.read(
        req.params.db,
        req.params.collection,
        req.params.id,
        req.query,
        req.params.options, (err, docs) => {
            res.set("content-type", "application/json; charset=utf-8");
            if (err) {
                throw err;
            }
            if (!docs || docs.length == 0) {
                res.json(404);
            } else {
                res.json(200, docs);
            }
        });
};

server.get('/_data/:db/:collection/count?', (req, res) => {
    log.debug(req.method, req.url);
    var query = req.query.query ? JSON.parse(req.query.query) : {};
    dataRest.count(req.params.db, req.params.collection, query, (err, result) => {
        res.set("content-type", "application/json; charset=utf-8");
        if (err) {
            throw err;
        }
        res.json(200, result);
    });
});

server.get('/_data/:db/:collection/:id?', read);

server.get('/_data/:db/:collection', read);

server.post("/_data/:db/:collection", (req, res) => {
    log.debug(req.method, req.url);
    dataRest.insert(req.params.db, req.params.collection, req.body, (err, result) => {
        res.set("content-type", "application/json; charset=utf-8");
        if (err) {
            throw err;
        }
        res.json(200, result);
    });
});

server.put("/_data/:db/:collection/:id", (req, res) => {
    log.debug(req.method, req.url);
    dataRest.update(req.params.db, req.params.collection, req.params.id, req.body, (err, result) => {
        res.set("content-type", "application/json; charset=utf-8");
        if (err) {
            throw err;
        }
        res.json(200, result);
    });
});

server.del("/_data/:db/:collection/:id", (req, res) => {
    log.debug(req.method, req.url);
    dataRest.remove(req.params.db, req.params.collection, req.params.id, (err, result) => {
        res.set("content-type", "application/json; charset=utf-8");
        if (err) {
            throw err;
        }
        res.json(200, result._id);
    });
}); 

//meta
server.get('/_meta/:db/:collection', (req, res) => {
    log.debug(req.method, req.url);
    dataRest.metadata({ database: req.params.db, collection: req.params.collection }, (err, result) => {
        res.set("content-type", "application/json; charset=utf-8");
        if (err) {
            throw err;
        }
        res.json(200, result);
    });
});

server.get('/_meta/:db', (req, res) => {
    log.debug(req.method, req.url);
    dataRest.metadata({ database: req.params.db }, (err, result) => {
        res.set("content-type", "application/json; charset=utf-8");
        if (err) {
            throw err;
        }
        res.json(200, result);
    });
});

server.get('/_meta', (req, res) => {
    log.debug(req.method, req.url);
    dataRest.metadata({ database: req.params.db }, (err, result) => {
        res.set("content-type", "application/json; charset=utf-8");
        if (err) {
            throw err;
        }
        res.json(200, result);
    });
});

//static content
server.get("/.*", restify.serveStatic({ directory: "./public", default: "index.html" }));

//starts
server.listen(config.server.port, () => {
    log.info("%s listening at %s", server.name, server.url);
});