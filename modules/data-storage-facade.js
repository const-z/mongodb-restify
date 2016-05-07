"use strict";

var DataStorage = require("./data-storage");
var BSON = require("bson");

class DataStorageFacade extends DataStorage {

    constructor(config) {
        super(config);
    }

    insert(databaseName, collectionName, data, callback) {
        data = Array.isArray(data) ? data[0] : data;
        this.deepSave(databaseName, collectionName, data, (err, result) => {
            callback(err, result);
        });
    }

    update(databaseName, collectionName, id, data, callback) {
        data = Array.isArray(data) ? data[0] : data;
        data._id = isNaN(id) ? new BSON.ObjectID(id) : +id
        this.deepSave(databaseName, collectionName, data, (err, result) => {
            callback(err, result);
        });
    }

    remove(databaseName, collectionName, id, callback) {
        id = isNaN(id) ? new BSON.ObjectID(id) : +id;
        super.remove(databaseName, collectionName, id, (err, result) => {
            callback(err, result);
        });
    }

    read(databaseName, collectionName, id, query, options, callback) {
        let loadJoined = Object.prototype.hasOwnProperty.call(query, "join");
        var q;
        if (id) {
            if (isNaN(id) && !BSON.ObjectID.isValid(id)) {
                throw Error("Неверный идентификатор");
            }
            q = {
                '_id': isNaN(id) ? new BSON.ObjectID(id) : +id
            };
        } else {
            q = query.query ? JSON.parse(query.query) : {};
        }

        options = options || {};

        var optionsKey = ['limit', 'sort', 'fields', 'skip', 'hint', 'explain', 'snapshot', 'timeout'];

        for (var v in query) {
            if (optionsKey.indexOf(v) !== -1) {
                options[v] = +query[v];
            }
        }

        let onResult = (err, result) => {
            callback(err, result);
        };

        if (loadJoined) {
            this.deepRead(databaseName, collectionName, q, options, onResult);
        } else {
            super.find(databaseName, collectionName, q, options, onResult);
        }
    }

    deepRead(databaseName, collectionName, query, options, callback) {
        let getIdsList = (obj) => {
            let result = [];
            for (let field in obj) {
                if (field !== "_id" &&
                    field.endsWith("_id") &&
                    (!isNaN(obj[field]) || (obj[field] instanceof BSON.ObjectID))) {
                    result.push(field);
                }
            }
            return result;
        }

        let proc = (db, collection, query, options, callback) => {
            super.find(db, collection, query, options, (err, docs) => {
                if (docs && docs.length > 0) {
                    let docsCount = docs.length;
                    for (let d in docs) {
                        let idsList = getIdsList(docs[d]);
                        let idsCount = idsList.length;
                        if (!idsCount) {
                            if (!--docsCount) {
                                callback(err, docs);
                            }
                            continue;
                        }
                        for (let id in idsList) {
                            let q = { "_id": docs[d][idsList[id]] };
                            proc(db, idsList[id], q, {}, (err, subDocs) => {
                                docs[d][idsList[id]] = subDocs ? subDocs[0] : null;
                                if (!--idsCount) {
                                    if (!--docsCount) {
                                        callback(err, docs);
                                    }
                                }
                            });
                        }
                    }
                } else {
                    callback(err, docs);
                }
            });
        }

        proc(databaseName, collectionName, query, options, (err, result) => {
            callback(err, result);
        });
    }

    deepSave(databaseName, collectionName, document, callback) {
        let getIdsList = (obj) => {
            let result = [];
            for (let field in obj) {
                if (field !== "_id" &&
                    field.endsWith("_id") &&
                    typeof obj[field] === "object") {
                    result.push(field);
                }
            }
            return result;
        }

        let proc = (collectionName, document, callback) => {
            var err = null;
            let idsList = getIdsList(document);
            let count = idsList.length;
            if (count == 0) {
                callback(err, document);
                return;
            }
            for (let field in idsList) {
                this.deepSave(databaseName, idsList[field], document[idsList[field]], (err, result) => {
                    document[idsList[field]] = result;
                    if (!--count) {
                        callback(err, document);
                        return;
                    }
                });
            }
        };

        proc(collectionName, document, (cn, doc) => {
            this.save(databaseName, collectionName, doc, (err, result) => {
                callback(err, result);
            });
        });
    }
}

module.exports = DataStorageFacade;