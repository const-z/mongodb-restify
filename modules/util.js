var debug = module.parent.parent.exports.debug;
var BSON = require("bson");
var MongoClient = require("mongodb").MongoClient;

var util = function () {
    var obj = this;

    obj.loadJoinedObject = function (doc, dbName, config, callback) {
        var collectionsNames = [];
        for (var f in doc) {
            if (f !== "_id" && f.indexOf("_id") > -1) {
                count++;
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
                        var result = [];
                        if (docs.length > 0) {
                            count--;
                            doc[collectionsNames[i] + "_id"] = docs[0];
                            if (count == 0) {
                                callback(doc);
                            }
                        }
                        db.close();
                    });
                });
            });
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