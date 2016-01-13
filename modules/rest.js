var MongoClient = require("mongodb").MongoClient;
var BSON = require("bson");
var server = module.parent.exports.server;
var config = module.parent.exports.config;
var debug = module.parent.exports.debug;
var restify = module.parent.exports.restify;
var util = require("./util");

debug("rest.js is loaded");

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

    var test = ['limit', 'sort', 'fields', 'skip', 'hint', 'explain', 'snapshot', 'timeout'];

    var v;
    for (v in req.query) {
        if (test.indexOf(v) !== -1) {
            options[v] = req.query[v];
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
                        // result = docs[0];//util.flavorize(docs[0], "out");
                        // res.json(result, { 'content-type': 'application/json; charset=utf-8' });
                        db.close();
                        util.loadJoinedObject(docs[0], req.params.db, config, function(doc) {
                            res.json(doc, { 'content-type': 'application/json; charset=utf-8' });    
                        });                        
                    } else {
                        res.json(404);
                    }
                } else {
                    docs.forEach(function (doc) {
                        result.push(doc);//util.flavorize(doc, "out"));
                    });
                    res.json(result, { 'content-type': 'application/json; charset=utf-8' });
                    db.close();
                }
                
            });
        });
    });
}

//get
server.get('/:db/:collection/:id?', handleGet);
server.get('/:db/:collection', handleGet);

//insert
server.post('/:db/:collection', function (req, res) {
    debug("POST-request received");
    if (req.params) {
        MongoClient.connect(util.connectionURL(req.params.db, config), function (err, db) {
            var collection = db.collection(req.params.collection);
            collection.insert(Array.isArray(req.params) ? util.cleanParams(req.params[0]) : util.cleanParams(req.params), function (err, docs) {
                res.header('Location', '/' + req.params.db + '/' + req.params.collection + '/' + docs.insertedIds[0]);
                res.set('content-type', 'application/json; charset=utf-8');
                res.json(201, docs.result);
                db.close();
            });
        });
    } else {
        res.set('content-type', 'application/json; charset=utf-8');
        res.json(200, { "ok": 0 });
    }
});

//update
server.put('/:db/:collection/:id', function (req, res) {
    debug("PUT-request received");
    var spec = {
        '_id': isNaN(req.params.id) ? new BSON.ObjectID(req.params.id) : +req.params.id
    };
    MongoClient.connect(util.connectionURL(req.params.db, config), function (err, db) {
        var collection = db.collection(req.params.collection);
        console.dir(util.cleanParams(req.params));
        collection.updateOne(spec, { $set: util.cleanParams(req.params) }, function (err, docs) {
            res.set('content-type', 'application/json; charset=utf-8');
            res.json(docs.result);
            db.close();
        });
    });
});

//delete
server.del('/:db/:collection/:id', function (req, res) {
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
