"use strict";
var restify = require("restify");
var MongoClient = require("mongodb").MongoClient;
// var _initStatic = Symbol("initStatis");
//var private = new WeakMap();

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
        this._initStaticContent();
        // this._initInsert();
        this.server.post('/_data/:db/:collection', this._onInsert.bind(this));
        this.server.listen(this.config.server.port, () => {
            console.log("%s listening at %s", this.server.name, this.server.url);
        });
    }

    _connect(databaseName, callback) {
        MongoClient.connect(this.connectionUrl + databaseName, (err, db) => {
            callback(db);
        });
    }

    _initStaticContent() {
        this.server.get("/.*", restify.serveStatic({
            directory: './public',
            default: 'index.html'
        }));
    }

    _onInsert(req, res) {
        if (!req.body) {
            res.set('content-type', 'application/json; charset=utf-8');
            res.json(200, { "ok": 0 });
            return;
        }
        var reqdoc = Array.isArray(req.body) ? req.body[0] : req.body;
        this._insert(req.params.db, req.params.collection, reqdoc, (docs) => {
            res.set('content-type', 'application/json; charset=utf-8');
            // docs.result._id = docs.insertedIds[0];
            res.json(201, docs.result);
        });
    }

    _insert(databaseName, collectionName, document, callback) {
        // var count = 0;
        // for (let field in document) {
        //     if (field.endsWith("_id")) {
        //         count++;
        //     }
        // }
        // for (let field in document) {
        //     let doc = document;
        //     //let f = field;
        //     if (field.endsWith("_id")) {
        //         this._insert(databaseName, field, document[field], (saved) => {
        //             doc[field] = saved.insertedIds[0];
        //             console.log(doc[field]);
        //             this._connect(databaseName, (db) => {
        //                 var collection = db.collection(field);
        //                 collection.insert(doc, (err, docs) => {
        //                     db.close();
        //                     if (--count == 0) {
        //                         callback(docs);
        //                     }
        //                 });
        //             });

        //         });
        //     }
        // }
        // if (count == 0) {
        // this._connect(databaseName, (db) => {
        //     var collection = db.collection(collectionName);
        //     collection.insert(document, (err, docs) => {
        //         db.close();
        //         callback(docs);
        //     });
        // });
        // }
        
        // this._connect(databaseName, (db) => {
        //         var collection = db.collection(collectionName);
        //         collection.insert(document, (err, docs) => {
        //             db.close();
        //             callback(docs);
        //         });
        //     });
        
        let proc = (databaseName, collectionName, document, callback) => {
            var count = 0;
            for (let field in document) {
                if (field.endsWith("_id")) {
                    count++;
                }
            }
            for (let field in document) {
                let doc = document;
                if (!field.endsWith("_id")) {
                    continue;
                }
                //this._insert(databaseName, field, doc[field], ()=>{});
                proc(databaseName, field, doc[field], () => {
                    doc[field] = "_id";
                    if (--count === 0) {
                        callback(databaseName, field, doc[field]);
                    }
                });                
                //callback(databaseName, field, doc[field]);
            }
            if (count == 0) {
                callback(databaseName, collectionName, document);
            }
        };

        proc(databaseName, collectionName, document, (databaseName, collectionName, document) => {
            console.dir(document);
        });

    }
}

module.exports = DataRest;