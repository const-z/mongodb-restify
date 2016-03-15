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
        var url = this.connectionUrl + databaseName;
        if (!databaseName) {
            databaseName = "__server__";
            url = this.connectionUrl;
        }
        if (!this._db_connections[databaseName]) {
            mongoClient.connect(url, (err, result) => {
                if (err) {
                    callback(err);
                    return;
                }
                this._db_connections[databaseName] = result;
                let on = (err) => {
                    result.removeListener('close', on);
                    delete this._db_connections[databaseName];
                };
                result.on("close", on);
                callback(null, result);
            });
        } else {
            callback(null, this._db_connections[databaseName]);
        }
    }

    find(databaseName, collectionName, query, options, callback) {
        this._connect(databaseName, (err, db) => {
            if (err) {
                callback(err);
                return;
            }
            var collection = db.collection(collectionName);
            collection.find(query, options, function(err, cursor) {
                cursor.toArray(function(err, docs) {
                    callback(err, docs);
                });
            });
        });
    }

    save(databaseName, collectionName, document, callback) {
        this._connect(databaseName, (err, db) => {
            if (err) {
                callback(err);
                return;
            }
            var collection = db.collection(collectionName);
            collection.insert(document, (err, docs) => {
                if (err && err.code == 11000) {
                    collection.updateOne({ "_id": document._id }, { $set: document }, function(err, docs) {
                        callback(err, document._id);
                    });
                } else {
                    callback(err, docs.insertedIds[0]);
                }
            });
        });
    }

    remove(databaseName, collectionName, id, callback) {
        this._connect(databaseName, (err, db) => {
            if (err) {
                callback(err);
                return;
            }
            var spec = { "_id": id };
            var collection = db.collection(collectionName);
            collection.deleteOne(spec, function(err, result) {
                callback(err, result);
            });
        });
    }

    count(databaseName, collectionName, query, callback) {
        this._connect(databaseName, (err, db) => {
            if (err) {
                callback(err);
                return;
            }
            var collection = db.collection(collectionName);
            collection.count(query, (err, result) => {
                callback(err, result);
            });
        });
    }

    //options.db - name of database - not required
    //options.collection - name of collection - not required
    metadata(options, callback) {
        if (!options.database && !options.collection) {
            this._connect(null, (err, result) => {
                if (err) {
                    callback(err);
                    return;
                }
                result.admin().listDatabases((err, result) => {
                    let count = result.databases.length;
                    for (let i in result.databases) {
                        let database = result.databases[i];
                        this._connect(database.name, (err, db) => {
                            if (err) {
                                callback(err);
                                return;
                            }
                            db.stats((err, stats) => {
                                database.stats = stats;
                                db.listCollections().toArray((err, collections) => {
                                    database.collections = collections;
                                    if (!--count) {
                                        callback(err, result);
                                    }
                                });
                            });
                        });
                    }
                });
            });
        } else if (options.database && !options.collection) {
            this._connect(options.database, (err, db) => {
                if (err) {
                    callback(err);
                    return;
                }
                let database = {};
                db.stats((err, result) => {
                    database.stats = result;
                    db.listCollections().toArray((err, collections) => {
                        database.collections = collections;
                        callback(err, database);
                    });
                });
            });
        } else {
            this._connect(options.database, (err, db) => {
                if (err) {
                    callback(err);
                    return;
                }
                var collection = db.collection(options.collection);
                collection.stats((err, result) => {
                    callback(err, result);
                });
            });
        }
    }
}

module.exports = DataStorage;