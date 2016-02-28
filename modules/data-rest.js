"use strict";
var restify = require("restify");
var mongoClient = require("mongodb").MongoClient;
var BSON = require("bson");

class DataRest {

    constructor(config) {
        this.config = config;
        var server = this.server = restify.createServer({
            name: "mongodb-restify"
        });
        server.acceptable = ["application/json"];
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
        this._db_connections = {};
    }

    start() {
        this.server.get('/_data/:db/:collection/:id?', this._onGet.bind(this));
        this.server.get('/_data/:db/:collection', this._onGet.bind(this));
        this.server.get("/.*", this._onStaticContent());
        this.server.post("/_data/:db/:collection", this._onInsert.bind(this));
        this.server.put("/_data/:db/:collection/:id", this._onUpdate.bind(this));
        this.server.del("/_data/:db/:collection/:id", this._onDelete.bind(this));
        this.server.listen(this.config.server.port, () => {
            console.log("%s listening at %s", this.server.name, this.server.url);
        });
    }

    _connect(databaseName, callback) {
        if (!this._db_connections[databaseName]) {
            //+"?connectTimeoutMS=300000&socketTimeoutMS=300000&wtimeoutMS=300000"
            mongoClient.connect(this.connectionUrl + databaseName, (err, db) => {
                if (err) {
                    throw err;
                }
                this._db_connections[databaseName] = db;
                callback(db);
            });
        } else {
            callback(this._db_connections[databaseName]);
        }
    }

    _onStaticContent() {
        return restify.serveStatic({
            directory: "./public",
            default: "index.html"
        });
    }

    _onInsert(req, res) {
        if (!req.body) {
            throw new Error("Не заданы данные для вставки");
        }
        var reqdoc = Array.isArray(req.body) ? req.body[0] : req.body;
        //todo сделать проверку на разбор документа по коллекциям
        this._recursive_save(req.params.db, req.params.collection, reqdoc, (id) => {
            res.set("content-type", "application/json; charset=utf-8");
            res.json(201, id);
        });
    }

    _onUpdate(req, res) {
        //todo проверить существование записи
        if (!req.body) {
            throw new Error("Не заданы данные для обновления");
        }
        var reqdoc = Array.isArray(req.body) ? req.body[0] : req.body;
        reqdoc._id = isNaN(req.params.id) ? new BSON.ObjectID(req.params.id) : +req.params.id
        this._recursive_save(req.params.db, req.params.collection, reqdoc, (id) => {
            res.set("content-type", "application/json; charset=utf-8");
            res.json(200, id);
        });
    }

    _onDelete(req, res) {
        this._connect(req.params.db, (db) => {
            var spec = {
                "_id": isNaN(req.params.id) ? new BSON.ObjectID(req.params.id) : +req.params.id
            };
            var collection = db.collection(req.params.collection);
            collection.deleteOne(spec, function (err, result) {
                res.set("content-type", "application/json; charset=utf-8");
                res.json(200, spec._id);
            });
        });
    }

    _onGet(req, res, next) {
        var query;
        if (req.params.id) {
            query = {
                '_id': isNaN(req.params.id) ? new BSON.ObjectID(req.params.id) : +req.params.id
            };
        } else {
            query = req.query.query ? util.parseJSON(req.query.query, next, restify) : {};
        }
        var options = req.params.options || {};

        var optionsKey = ['limit', 'sort', 'fields', 'skip', 'hint', 'explain', 'snapshot', 'timeout'];

        let loadJoined = Object.prototype.hasOwnProperty.call(req.query, "join");

        for (var v in req.query) {
            if (optionsKey.indexOf(v) !== -1) {
                options[v] = +req.query[v];
            }
        }

        // if (req.body.toString().length > 0) {
        //     var body = req.body.split(",");
        //     if (body[0]) {
        //         query = util.parseJSON(body[0], next);
        //     }
        //     if (body[1]) {
        //         options = util.parseJSON(body[1], next);
        //     }
        // }
        
        let getIdsList = (obj) => {
            let result = [];
            for (let field in obj) {
                if (field !== "_id" && field.endsWith("_id") && typeof obj[field] !== "object") {
                    result.push(field);
                }
            }
            return result;
        }

        let proc = (db, collectionName, id, callback) => {
            var collection = db.collection(collectionName);
            let query = null;
            if (id) {
                query = {
                    '_id': isNaN(id) ? new BSON.ObjectID(id) : +id
                };
            }
            collection.find(query, options, function (err, cursor) {
                cursor.toArray(function (err, docs) {
                    var result = [];
                    var docsCount = docs.length;
                    if (docsCount === 0) {
                        if (id) {
                            callback(null);
                            return;
                        }
                        callback(result);
                        return;
                    }
                    for (let i in docs) {
                        let doc = docs[i];
                        if (!loadJoined) {
                            result.push(doc);
                            if (!--docsCount) {
                                callback(result);
                            }
                        } else {
                            let idsList = getIdsList(doc);
                            let idsCount = idsList.length;
                            if (idsCount === 0) {
                                if (id) {
                                    callback(doc);
                                    return;
                                }
                                result.push(doc);
                                if (!--docsCount) {
                                    callback(result);
                                    return;
                                }
                            }
                            for (let field in idsList) {
                                proc(db, idsList[field], doc[idsList[field]], (d) => {
                                    doc[idsList[field]] = d;
                                    if (!--idsCount) {
                                        if (id) {
                                            callback(doc);
                                            return;
                                        }
                                        result.push(doc);
                                        if (!--docsCount) {
                                            callback(result);
                                        }
                                    }
                                });
                            }
                        }
                    }
                });
            });
        };

        this._connect(req.params.db, (db) => {
            proc(db, req.params.collection, req.params.id, (doc) => {
                res.set("content-type", "application/json; charset=utf-8");
                if (!doc) {
                    res.json(404);
                } else {
                    res.json(200, doc);
                }
            });
        });
    }

    _save(databaseName, collectionName, document, callback) {
        this._connect(databaseName, (db) => {
            var collection = db.collection(collectionName);
            collection.insert(document, (err, docs) => {
                if (err && err.code == 11000) {
                    collection.updateOne({ "_id": document._id }, { $set: document }, function (err, docs) {
                        callback(document._id);
                    });
                } else {
                    if (err) {
                        console.warn(err);
                        throw err;
                    }
                    callback(docs.insertedIds[0]);
                }
            });
        });
    }

    _recursive_save(databaseName, collectionName, document, callback) {
        
        let getIdsList = (obj) => {
            let result = [];
            for (let field in obj) {
                if (field !== "_id" && field.endsWith("_id") && typeof obj[field] === "object") {
                    result.push(field);
                }
            }
            return result;
        }
        
        let proc = (collectionName, document, callback) => {
            let idsList = getIdsList(document);
            let count = idsList.length;
            if (count == 0) {
                callback(collectionName, document);
                return;
            }
            for (let field in idsList) {
                this._recursive_save(databaseName, idsList[field], document[idsList[field]], (id) => {
                    document[idsList[field]] = id;
                    if (!--count) {
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