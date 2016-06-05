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
					return collection.deleteOne(spec);
				})
				.then(result => {
					resolve(result);
				})
				.catch(err => {
					reject(err);
				});
		});
	}

	count(databaseName, collectionName, query) {
		return new Promise((resolve, reject) => {
			this._connect(databaseName)
				.then(db => {
					var collection = db.collection(collectionName);
					return collection.count(query);
				})
				.then(result => {
					resolve(result);
				}).catch(err => {
					reject(err);
				});
		});
	}

	// options.db - name of database - not required. if present then return database metadata
	// options.collection - name of collection - not required. if present then options.db become required, return metadata
	metadata(options) {

		var getCollectionInfo = (database, collection) => {
			return new Promise((resolve, reject) => {
				this._connect(database)
					.then(dbConnection => {
						return dbConnection.collection(collection).stats();
					})
					.then(stats => {
						resolve({ "name": collection, "stats": stats });
					})
					.catch(err => {
						reject(err);
					});
			});
		};

		var getDBInfo = (database) => {
			return new Promise((resolve, reject) => {
				let info = { name: database };
				this._connect(database)
					.then(dbConnection => {
						return dbConnection.listCollections().toArray();
					})
					.then(collections => {
						info.collections = collections;
						let colInfos = [];
						for (let c of info.collections) {
							colInfos.push(getCollectionInfo(database, c.name));
						}
						return Promise.all(colInfos);
					})
					.then(collectionsInfos => {
						for (let c of info.collections) {
							for (let ci of collectionsInfos) {
								if (c.name === ci.name) {
									c.stats = ci.stats;
								}
							}
						}
						return this._connect(info.name);
					})
					.then(dbConnection => {
						return dbConnection.stats();
					})
					.then(stats => {
						info.stats = stats;
						resolve(info);
					})
					.catch(err => {
						reject(err);
					});
			});
		};

		if (!options.database && !options.collection) {
			return new Promise((resolve, reject) => {
				this._connect(null)
					.then(result => {
						return result.admin().listDatabases();
					})
					.then(result => {
						let promises = [];
						for (let database of result.databases) {
							promises.push(getDBInfo(database.name));
						}
						Promise.all(promises)
							.then((results) => {
								resolve({ "databases": results });
							})
							.catch((err) => {
								reject(err);
							});
					})
					.catch(err => {
						reject(err);
					});
			});
		} else if (options.database && !options.collection) {
			return new Promise((resolve, reject) => {
				getDBInfo(options.database)
					.then(info => {
						resolve(info);
					})
					.catch(err => {
						reject(err);
					});
			});
		} else {
			return new Promise((resolve, reject) => {
				getCollectionInfo(options.database, options.collection)
					.then(collectionInfo => {
						resolve(collectionInfo.stats);
					})
					.catch(err => {
						reject(err);
					});
			});
		}
	}
}

module.exports = DataStorage;