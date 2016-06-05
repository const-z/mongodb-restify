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

    update(databaseName, collectionName, id, data) {
        data = Array.isArray(data) ? data[0] : data;
        data._id = isNaN(id) ? new BSON.ObjectID(id) : +id;

        return new Promise((resolve, reject) => {
            this.count(databaseName, collectionName, { "_id": data._id })
                .then(result => {
                    if (result === 0) {
                        resolve(null);
                        return;
                    }
                    this.deepSave(databaseName, collectionName, data, (err, result) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(result);
                    });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    remove(databaseName, collectionName, id) {
        id = isNaN(id) ? new BSON.ObjectID(id) : +id;
		return new Promise((resolve, reject) => {
            this.count(databaseName, collectionName, { "_id": id })
                .then(result => {
                    if (result === 0) {
                        resolve(null);
                        return;
                    }
                    return super.remove(databaseName, collectionName, id);
				})
				.then(result => {
					resolve(result);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    read(databaseName, collectionName, id, query, options) {
		return new Promise((resolve, reject) => {
			let loadJoined = Object.prototype.hasOwnProperty.call(query, "join");
			var q;
			if (id) {
				if (isNaN(id) && !BSON.ObjectID.isValid(id)) {
					throw Error("Неверный идентификатор");
				}
				q = {
					"_id": isNaN(id) ? new BSON.ObjectID(id) : +id
				};
			} else {
				q = query.query ? JSON.parse(query.query) : {};
			}

			options = options || {};

			var optionsKey = ["limit", "sort", "fields", "skip", "hint", "explain", "snapshot", "timeout"];

			for (var v in query) {
				if (optionsKey.indexOf(v) !== -1) {
					options[v] = +query[v];
				}
			}

			// let onResult = (err, result) => {
			//     callback(err, result);
			// };

			if (loadJoined) {
				this.deepRead(databaseName, collectionName, q, options)
					.then(result => {
						resolve(result);
					})
					.catch(err => {
						reject(err);
					});
			} else {
				super.find(databaseName, collectionName, q, options)
					.then(result => {
						//onResult(null, result);
						resolve(result);
					})
					.catch(err => {
						reject(err);
					});
			}
		});
	}

    deepRead(databaseName, collectionName, query, options) {
		return new Promise((resolve, reject) => {
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
			};

			let proc = (db, collection, query, options) => {
				return new Promise((resolve, reject) => {
					super.find(db, collection, query, options)
						.then(docs => {
							if (docs && docs.length > 0) {
								let docsCount = docs.length;

								for (let d of docs) {
									//


									промис алл для документов

									let idsList = getIdsList(d);
									let idsCount = idsList.length;

									if (!idsCount) {
										if (!--docsCount) {
											resolve(docs);
										}
										continue;
									}
									let promisesSubDocs = [];
									for (let id of idsList) {
										let q = { "_id": d[id] };
										promisesSubDocs.push(proc(db, id, q, {}));
									}
									Promise.all(promisesSubDocs)
										.then(subDocs => {
											for (let sd of subDocs) {
												d[sd.name] = sd;
											}
										})
										.catch(err => {
											reject(err);
										});
								}
							} else {
								resolve(docs);
							}
						})
						.catch(err => {
							reject(err);
						});
				});
			};

			proc(databaseName, collectionName, query, options)
				.then(result => {
					resolve(result);
				})
				.catch(err => {
					reject(err);
				});
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
		};

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
			this.save(databaseName, collectionName, doc)
				.then(result => {
					callback(null, result);
				})
				.catch(err => {
					callback(err);
				});
		});
	}
}

module.exports = DataStorageFacade;