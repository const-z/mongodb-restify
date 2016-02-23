'use stricts'
//todo слушать изменения коллекций, добавлять слушателей коллекций по мере обращения
//
var MongoClient = require("mongodb").MongoClient;
var BSON = require("bson");
var util = require("./util");

var server = module.parent.exports.server;
var config = module.parent.exports.config;
var debug = module.parent.exports.debug;
var restify = module.parent.exports.restify;

debug("rest.js is loaded");

// var MongoWatch = require('mongo-watch');
// var watcher = new MongoWatch({ parser: 'pretty' });

// watcher.watch('test2.col', function (event) {
//     return console.log('something changed:', event);
// });

function handleGet(req, res, next) {
    debug("GET-request received");
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

    var loadJoined = Object.prototype.hasOwnProperty.call(req.query, "join");

    for (var v in req.query) {
        if (optionsKey.indexOf(v) !== -1) {
            options[v] = +req.query[v];
        }
    }

    if (req.body.toString().length > 0) {
        var body = req.body.split(",");
        if (body[0]) {
            query = util.parseJSON(body[0], next);
        }
        if (body[1]) {
            options = util.parseJSON(body[1], next);
        }
    }

    MongoClient.connect(util.connectionURL(req.params.db, config), function (err, db) {
        var collection = db.collection(req.params.collection);
        collection.find(query, options, function (err, cursor) {
            cursor.toArray(function (err, docs) {
                var result = [];
                if (req.params.id) {
                    if (docs.length > 0) {
                        if (loadJoined) {
                            util.loadJoinedObject(docs[0], req.params.db, config, function (doc) {
                                res.json(doc, { 'content-type': 'application/json; charset=utf-8' });
                            });
                        } else {
                            result = docs[0];
                            res.json(result, { 'content-type': 'application/json; charset=utf-8' });
                        }
                    } else {
                        res.json(404);
                    }
                } else {
                    var count = docs.length;
                    if (docs.length > 0 && loadJoined) {
                        docs.forEach(function (doc) {
                            util.loadJoinedObject(doc, req.params.db, config, function (doc) {
                                result.push(doc);
                                if (--count == 0) {
                                    res.json(result, { 'content-type': 'application/json; charset=utf-8' });
                                }
                            });
                        });
                    } else {
                        res.json(docs, { 'content-type': 'application/json; charset=utf-8' });
                    }
                }
                db.close();
            });
        });
    });
}

//get
server.get('/_data/:db/:collection/:id?', handleGet);
server.get('/_data/:db/:collection', handleGet);


//insert
server.post('/_data/:db/:collection', function (req, res) {
    debug("POST-request received");
    if (!req.body) {
        res.set('content-type', 'application/json; charset=utf-8');
        res.json(200, { "ok": 0 });
        return;
    }
    var reqdoc = Array.isArray(req.body) ? req.body[0] : req.body;
    var processDoc;
    if ("join" in req.query) {
        processDoc = util.saveJoinedObject;
    } else {
        processDoc = function (reqdoc, dbName, config, callback) {
            callback(reqdoc);
        };
    }
    processDoc(reqdoc, req.params.db, config, function (doc) {
        MongoClient.connect(util.connectionURL(req.params.db, config), function (err, db) {
            var collection = db.collection(req.params.collection);
            collection.insert(doc, function (err, docs) {
                //res.header('Location', '/' + req.params.db + '/' + req.params.collection + '/' + docs.insertedIds[0]);
                res.set('content-type', 'application/json; charset=utf-8');
                docs.result._id = docs.insertedIds[0];
                res.json(201, docs.result);
                db.close();
            });
        });
    });
});

//update
server.put('/_data/:db/:collection/:id', function (req, res) {
    debug("PUT-request received");
    var spec = {
        '_id': isNaN(req.params.id) ? new BSON.ObjectID(req.params.id) : +req.params.id
    };
    var reqdoc = Array.isArray(req.body) ? req.body[0] : req.body;
    var processDoc;
    if ("join" in req.query) {
        processDoc = util.saveJoinedObject;
    } else {
        processDoc = function (reqdoc, dbName, config, callback) {
            callback(reqdoc);
        };
    }
    processDoc(reqdoc, req.params.db, config, function (doc) {
        MongoClient.connect(util.connectionURL(req.params.db, config), function (err, db) {
            var collection = db.collection(req.params.collection);
            collection.updateOne(spec, { $set: doc }, function (err, docs) {
                res.set('content-type', 'application/json; charset=utf-8');
                res.json(docs.result);
                db.close();
            });
        });
    });
});

//delete
server.del('/_data/:db/:collection/:id', function (req, res) {
    debug("DELETE-request received");
    var spec = {
        '_id': isNaN(req.params.id) ? new BSON.ObjectID(req.params.id) : +req.params.id
    };
    MongoClient.connect(util.connectionURL(req.params.db, config), function (err, db) {
        var collection = db.collection(req.params.collection);
        collection.deleteOne(spec, function (err, result) {
            res.set('content-type', 'application/json; charset=utf-8');
            res.json(result);
            db.close();
        });
    });
});

//meta
server.get('/_meta/databases', function (req, res) {
    var murl = "mongodb://" + config.db.host + ":" + config.db.port + "/";
    MongoClient.connect(murl, function (err, db) {
        db.admin().listDatabases(function (err, dbs) {
            res.set('content-type', 'application/json; charset=utf-8');
            res.json(dbs);
            db.close();
        });
    });
});

server.get('/_meta/:db/collections', function (req, res) {
    var murl = "mongodb://" + config.db.host + ":" + config.db.port + "/" + req.params.db;
    MongoClient.connect(murl, function (err, db) {
        db.listCollections().toArray(function (err, collections) {
            res.set('content-type', 'application/json; charset=utf-8');
            res.json(collections);
            db.close();
        });
    });
});

server.get('/_meta/:db/:collection/count', function (req, res, next) {
    MongoClient.connect(util.connectionURL(req.params.db, config), function (err, db) {
        var collection = db.collection(req.params.collection);
        collection.count(function (err, count) {
            res.json({ count: count }, { 'content-type': 'application/json; charset=utf-8' });
            db.close();
        });
    })
});

server.get('/_meta/:db/stats', function (req, res, next) {
    MongoClient.connect(util.connectionURL(req.params.db, config), function (err, db) {
        db.stats(function (err, stats) {
            res.json(stats, { 'content-type': 'application/json; charset=utf-8' });
            db.close();
        })
    });
});

server.get('/_meta/:db/:collection/stats', function (req, res, next) {
    MongoClient.connect(util.connectionURL(req.params.db, config), function (err, db) {
        var collection = db.collection(req.params.collection);
        collection.stats(function (err, stats) {
            res.json(stats, { 'content-type': 'application/json; charset=utf-8' });
            db.close();
        });
    })
});

//TODO: метод создания БД
//TODO: сохранять/читать описание БД
//TODO: 

//serve static
server.get("/.*", restify.serveStatic({
    directory: './public',
    default: 'index.html'
}));

//HTTP 404
server.on('ResourceNotFound', function (req, res, err, cb) {
    res.writeHead(301, { "Content-Type": "text/plain", "Location": "/?url=" + req.url });
    res.end();
});
