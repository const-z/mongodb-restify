"use strict";

var debug = module.parent.parent.exports.debug;
var BSON = require("bson");
var MongoClient = require("mongodb").MongoClient;

var util = function () {
    var obj = this;

    obj.loadJoinedObject = function loadJoinedObject(doc, dbName, config, callback) {
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
            loadElement(dbName, config, collectionsNames[i], doc, function (collectionName, ldoc) {
                loadJoinedObject(ldoc, dbName, config, function (lldoc) {
                    doc[collectionName + "_id"] = lldoc;
                    if (--count == 0) {
                        callback(doc);
                    }
                });
            });
        }
    };

    function loadElement(dbName, config, collectionName, doc, callback) {
        var valueId = doc[collectionName + "_id"];
        var query = {
            '_id': isNaN(valueId) ? new BSON.ObjectID(valueId) : +valueId
        };
        MongoClient.connect(obj.connectionURL(dbName, config), function (err, db) {
            var collection = db.collection(collectionName);
            collection.find(query, {}, function (err, cursor) {
                cursor.toArray(function (err, docs) {
                    callback(collectionName, docs[0]);
                    db.close();
                });
            });
        });
    }

    obj.saveJoinedObject = function saveJoinedObject(doc, dbName, config, callback) {
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
            if (typeof joinedObject == "object") {
                joinedObject = Array.isArray(joinedObject) ? joinedObject[0] : joinedObject;
                saveElement(dbName, config, collectionsNames[i], doc, joinedObject, function (doc, collectionName, id) {
                    doc[collectionName + "_id"] = id;
                    if (--count == 0) {
                        callback(doc);
                    }
                });
            } else {
                if (--count == 0) {
                    callback(doc);
                }
            }
        }
    };

    function saveElement(dbName, config, collectionName, doc, subDoc, callback) {
        obj.saveJoinedObject(subDoc, dbName, config, function (subDoc) {
            MongoClient.connect(obj.connectionURL(dbName, config), function (err, db) {
                var collection = db.collection(collectionName);
                collection.insert(subDoc, function (err, docs) {
                    if (err && err.code == 11000) {
                        collection.updateOne({ "_id": subDoc._id }, { $set: subDoc }, function (err, docs) {
                            db.close();
                            callback(doc, collectionName, subDoc._id);
                        });
                    } else {
                        db.close();
                        callback(doc, collectionName, docs.insertedIds[0]);
                    }
                });
            });

        });
    }

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