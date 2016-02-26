"use strict";
var restify = require("restify");
var mongoClient = require("mongodb").MongoClient;

class DataRest {

    constructor(config) {
        this.config = config;
        var server = this.server = restify.createServer({
            name: "mongodb-restify"
        });
        server.acceptable = ['application/json'];
        server.use(restify.acceptParser(this.server.acceptable));
        server.use(restify.bodyParser());
        server.use(restify.fullResponse());
        server.use(restify.queryParser());
        server.use(restify.jsonp());

        var auth = "";
        if (config.db.username && config.db.password) {
            auth = config.db.username + ":" + config.db.password + "@";
        }
        this.connectionUrl = "mongodb://" + auth + config.db.host + ":" + config.db.port + "/";
    }

    start() {
        this.server.get("/.*", this._onStaticContent());
        this.server.post('/_data/:db/:collection', this._onInsert.bind(this));
        this.server.listen(this.config.server.port, () => {
            console.log("%s listening at %s", this.server.name, this.server.url);
        });
    }

    _connect(databaseName, callback) {
        mongoClient.connect(this.connectionUrl + databaseName, (err, db) => {
            callback(db);
        });
    }

    _onStaticContent() {
        return restify.serveStatic({
            directory: './public',
            default: 'index.html'
        });
    }

    _onInsert(req, res) {
        if (!req.body) {
            res.set('content-type', 'application/json; charset=utf-8');
            res.json(200, { "ok": 0 });
            return;
        }
        var reqdoc = Array.isArray(req.body) ? req.body[0] : req.body;
        this._insert(req.params.db, req.params.collection, reqdoc, (id) => {
            res.set('content-type', 'application/json; charset=utf-8');
            res.json(201, id);
        });
    }


    _save(databaseName, collectionName, document, callback) {
        this._connect(databaseName, (db) => {
            var collection = db.collection(collectionName);
            collection.insert(document, (err, docs) => {
                if (err && err.code == 11000) {
                    collection.updateOne({ "_id": document._id }, { $set: document }, function (err, docs) {
                        db.close();
                        callback(document._id);
                    });
                } else {
                    db.close();
                    callback(docs.insertedIds[0]);
                }                
            });
        });
    }

    _insert(databaseName, collectionName, document, callback) {
        let proc = (collectionName, document, callback) => {
            let count = 0;
            for (let field in document) {
                if (field.endsWith("_id")) {
                    count++;
                }
            }
            if (count == 0) {
                callback(collectionName, document);
                return;
            }
            for (let field in document) {
                if (!field.endsWith("_id")) {
                    continue;
                }
                this._insert(databaseName, field, document[field], (id) => {
                    document[field] = id;
                    if (--count === 0) {
                        callback(collectionName, document);
                        return;
                    }
                });
            }
        };

        proc(collectionName, document, (cn, doc) => {
            this._save(databaseName, cn, doc, (id) => {
                callback(id);
            });
        });

    }
}

module.exports = DataRest;