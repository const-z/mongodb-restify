"use strict";

var mongoClient = require("mongodb").MongoClient;

class DataStorage {
    
    constructor(config) {
        var auth = "";
        if (config.db.username && config.db.password) {
            auth = config.db.username + ":" + config.db.password + "@";
        }
        this.connectionUrl = "mongodb://" + auth + config.db.host + ":" + config.db.port + "/";
        this._db_connections = {};
    }
    
    _connect(databaseName, callback) {
        if (!this._db_connections[databaseName]) {
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
    
    find(databaseName, collectionName, query, options, callback){
        this._connect(databaseName, (db) => {
        var collection = db.collection(collectionName);
            collection.find(query, options, function (err, cursor) {
                cursor.toArray(function (err, docs) {
                    callback(err, docs);
                });
            });
        });
    }
    
    save(databaseName, collectionName, document, callback) {
        this._connect(databaseName, (db) => {
            var collection = db.collection(collectionName);
            collection.insert(document, (err, docs) => {
                if (err && err.code == 11000) {
                    collection.updateOne({ "_id": document._id }, { $set: document }, function (err, docs) {
                        callback(err, document._id);
                    });
                } else {
                    callback(err, docs.insertedIds[0]);
                }
            });
        });
    }
    
    remove(databaseName, collectionName, id, callback){
        this._connect(databaseName, (db) => {
            var spec = {
                "_id": id 
            };
            var collection = db.collection(collectionName);
            collection.deleteOne(spec, function (err, result) {
                callback(err, result);
            });
        });
    }
    
}

module.exports = DataStorage;