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

	_connect(databaseName) {
		return new Promise((resolve, reject) => {
			var url = this.connectionUrl + databaseName;
			if (!databaseName) {
				databaseName = "__server__";
				url = this.connectionUrl;
			}
			if (!this._db_connections[databaseName]) {
				mongoClient.connect(url)
					.then(db => {
						this._db_connections[databaseName] = db;
						let on = () => {
							db.removeListener("close", on);
							delete this._db_connections[databaseName];
						};
						db.on("close", on);
						resolve(db);
					})
					.catch(err => {
						reject(err);
					});
			} else {
				resolve(this._db_connections[databaseName]);
			}
		});
	}

	find(databaseName, collectionName, query, options) {
		return new Promise((resolve, reject) => {
			this._connect(databaseName)
				.then(db => {
					var collection = db.collection(collectionName);
					collection.find(query, options, function (err, cursor) {
						cursor.toArray(function (err, docs) {
							resolve(docs);
						});
					});
				})
				.catch(err => {
					reject(err);
				});
		});
	}

	// save(databaseName, collectionName, document, callback) {
	// 	this._connect(databaseName).then(db => {
	// 		var collection = db.collection(collectionName);
	// 		collection.insert(document, (err, docs) => {
	// 			if (err && err.code == 11000) {
	// 				collection.updateOne({ "_id": document._id }, { $set: document }, function (err, docs) {
	// 					callback(err, document._id);
	// 				});
	// 			} else {
	// 				callback(err, docs.insertedIds[0]);
	// 			}
	// 		});
	// 	})
	// 		.catch(err => {
	// 			callback(err);
	// 		});
	// }

	save(databaseName, collectionName, document) {
		return new Promise((resolve, reject) => {
			this._connect(databaseName)
				.then(db => {
					var collection = db.collection(collectionName);
					if (document._id) {
						return collection.updateOne({ "_id": document._id }, { $set: document });
					} else {
						return collection.insertOne(document);
					}
				})
				.then(result => {
					if (result.insertedId) {
						resolve(result.insertedId);
					} else {
						resolve(document._id);
					}
				})
				.catch(err => {
					reject(err);
				});
		});
	}

	remove(databaseName, collectionName, id) {
		return new Promise((resolve, reject) => {
			this._connect(databaseName)
				.then(db => {
					var spec = { "_id": id };
					var collection = db.collection(collectionName);
					collection.deleteOne(spec)
						.then(result => {
							resolve(result);
						})
						.catch(err => {
							reject(err);
						});
				})
				.catch(err => {
					reject(err);
				});
		});
	}

	// count(databaseName, collectionName, query) {
	// 	return new Promise((resolve, reject) => {
	// 		this._connect(databaseName).then(db => {
	// 			var collection = db.collection(collectionName);
	// 			collection.count(query).then(result => {
	// 				resolve(result);
	// 			}).catch(err => {
	// 				reject(err);
	// 			});
	// 		}).catch(err => {
	// 			reject(err);
	// 		});
	// 	});
	// }
	count(databaseName, collectionName, query) {
		return new Promise((resolve, reject) => {
			this._connect(databaseName).then(db => {
				var collection = db.collection(collectionName);
				collection.count(query).then(result => {
					resolve(result);
				}).catch(err => {
					reject(err);
				});
			}).catch(err => {
				reject(err);
			});
		});
	}

	// options.db - name of database - not required. if present then return database metadata
	// options.collection - name of collection - not required. if present then options.db become required, return metadata
	metadata(options, callback) {
		if (!options.database && !options.collection) {
			this._connect(null)
				.then(result => {
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
				})
				.catch(err => {
					reject(err);
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