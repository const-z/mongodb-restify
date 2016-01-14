var debug = module.parent.parent.exports.debug;
var BSON = require("bson");
var MongoClient = require("mongodb").MongoClient;

var util = function () {
    var obj = this;

    obj.loadJoinedObject = function (doc, dbName, config, callback) {
        var collectionsNames = [];
        for (var f in doc) {
            if (f !== "_id" && f.indexOf("_id") > -1) {
                collectionsNames.push(f.slice(0, -3));
            }
        }

        var count = collectionsNames.length;
        if (count == 0) {
            callback(doc);
            return;
        }

        for (var i in collectionsNames) {
            MongoClient.connect(obj.connectionURL(dbName, config), function (err, db) {
                var collection = db.collection(collectionsNames[i]);
                var id = doc[collectionsNames[i] + "_id"];
                var query = {
                    '_id': isNaN(id) ? new BSON.ObjectID(id) : +id
                };
                collection.find(query, {}, function (err, cursor) {
                    cursor.toArray(function (err, docs) {
                        if (docs.length > 0) {
                            doc[collectionsNames[i] + "_id"] = docs[0];
                            if (--count == 0) {
                                callback(doc);
                            }
                        }
                        db.close();
                    });
                });
            });
        }
    };

    obj.saveJoinedObject = function (doc, dbName, config, callback) {
        var collectionsNames = [];
        for (var f in doc) {
            if (f !== "_id" && f.indexOf("_id") > -1) {
                collectionsNames.push(f.slice(0, -3));
            }
        }
        var count = collectionsNames.length;
        if (count == 0) {
            callback(doc);
            return;
        }
        for (var i in collectionsNames) {
            var joinedObject = doc[collectionsNames[i] + "_id"];
            joinedObject = Array.isArray(joinedObject) ? joinedObject[0] : joinedObject;
            if (joinedObject._id) {
                joinedObject._id = isNaN(joinedObject._id) ? new BSON.ObjectID(joinedObject._id) : +joinedObject._id;
            }
            if (typeof joinedObject == "object") {
                MongoClient.connect(obj.connectionURL(dbName, config), function (err, db) {
                    var collection = db.collection(collectionsNames[i]);
                    collection.insert(joinedObject, function (err, docs) {
                        if (err && err.code == 11000) {
                            collection.updateOne({ "_id": joinedObject._id }, { $set: joinedObject }, function (err, docs) {
                                doc[collectionsNames[i] + "_id"] = joinedObject._id;
                                if (--count == 0) {
                                    callback(doc);
                                }
                                db.close();
                            });
                        } else {
                            doc[collectionsNames[i] + "_id"] = docs.insertedIds[0];
                            if (--count == 0) {
                                callback(doc);
                            }
                            db.close();
                        }
                    });
                });
            }
        }

    };

    obj.cleanParams = function (params) {
        var clean = JSON.parse(JSON.stringify(params));
        if (clean._id) {
            delete clean._id;
        }
        if (clean.id) {
            delete clean.id;
        }
        if (clean.db) {
            delete clean.db;
        }
        if (clean.collection) {
            delete clean.collection;
        }
        return clean;
    };

    obj.parseJSON = function (data, next, restify) {
        var json;
        try {
            json = JSON.parse(data);
        } catch (e) {
            return next(new restify.InvalidArgumentError("Not valid JSON data."));
        }
        return json;
    };

    obj.connectionURL = function (dbName, config) {
        var auth = "";
        if (config.db.username && config.db.password) {
            auth = config.db.username + ":" + config.db.password + "@";
        }
        return "mongodb://" + auth + config.db.host + ":" + config.db.port + "/" + dbName; // + "?maxPoolSize=20";
    }

    return obj;
};

module.exports = util();
debug("util.js is loaded");