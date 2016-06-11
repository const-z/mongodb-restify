"use strict";

var express = require("express");
var log = require("intel").getLogger("server.js");
var bodyParser = require("body-parser");
var helmet = require("helmet");
var compression = require("compression");
var server = express();
var errorToJSON = require("utils-error-to-json");
//
var DataStorageFacade = require("./modules/data-storage-facade");
var Config = require("./modules/config");

////////////////////////////////////////////////

var config = new Config("/config.json");
var dataStorageFacade = new DataStorageFacade(config);

log.info("start in [", server.get("env"), "] mode");

server.set("trust proxy", 1); // trust first proxy
server.use(bodyParser.json()); // for parsing application/json
server.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
server.use(helmet());
server.use(compression());

var router = express.Router();
router.use(function (req, res, next) {
	log.debug("%s %s", req.method, req.url);
	next();
});
server.use("/", router);

let read = (req, res) => {
	dataStorageFacade.read(req.params.db, req.params.collection, req.params.id, req.query, req.params.options)
		.then(docs => {
			res.set("content-type", "application/json; charset=utf-8");
			if (!docs || docs.length == 0) {
				res.status(404).json(docs);
			} else {
				res.status(200).json(docs);
			}
		}).catch(err => {
			res.status(500).json(errorToJSON(err));
			log.error(err);
			throw err;
		});
};

server.get("/_data/:db/:collection/count?", (req, res) => {
	var query = req.query.query ? JSON.parse(req.query.query) : {};
	dataStorageFacade.count(req.params.db, req.params.collection, query)
		.then(result => {
			res.set("content-type", "application/json; charset=utf-8");
			res.status(200).json(result);
		})
		.catch(err => {
			res.status(500).json(errorToJSON(err));
			log.error(err);
			throw err;
		});
});

server.get("/_data/:db/:collection/:id?", read);

server.get("/_data/:db/:collection", read);

server.post("/_data/:db/:collection", (req, res) => {
	dataStorageFacade.insert(req.params.db, req.params.collection, req.body, (err, result) => {
		res.set("content-type", "application/json; charset=utf-8");
		if (err) {
			res.status(500).json(errorToJSON(err));
			throw err;
		}
		res.status(200).json(result);
	});
});

server.put("/_data/:db/:collection/:id", (req, res) => {
	dataStorageFacade.update(req.params.db, req.params.collection, req.params.id, req.body)
		.then(result => {
			res.set("content-type", "application/json; charset=utf-8");
			if (!result) {
				res.status(404).end();
				return;
			}
			res.status(200).json(result);
		})
		.catch(err => {
			res.status(500).json(errorToJSON(err));
			log.error(err);
			throw err;
		});
});

server.delete("/_data/:db/:collection/:id", (req, res) => {
	dataStorageFacade.remove(req.params.db, req.params.collection, req.params.id)
		.then(result => {
			res.set("content-type", "application/json; charset=utf-8");
			if (!result) {
				res.status(404).end();
				return;
			}
			res.status(200).end();
		})
		.catch(err => {
			res.status(500).json(errorToJSON(err));
			log.error(err);
			throw err;
		});
});

// meta
server.get("/_meta/:db/:collection", (req, res) => {
	dataStorageFacade.metadata({ database: req.params.db, collection: req.params.collection })
		.then(result => {
			res.set("content-type", "application/json; charset=utf-8");
			res.status(200).json(result);
		})
		.catch(err => {
			res.status(500).json(errorToJSON(err));
			log.error(err);
			throw err;
		});
});

server.get("/_meta/:db", (req, res) => {
	dataStorageFacade.metadata({ database: req.params.db })
		.then(result => {
			res.set("content-type", "application/json; charset=utf-8");
			res.status(200).json(result);
		})
		.catch(err => {
			res.status(500).json(errorToJSON(err));
			log.error(err);
			throw err;
		});
});

server.get("/_meta", (req, res) => {
	dataStorageFacade.metadata({})
		.then(result => {
			res.set("content-type", "application/json; charset=utf-8");
			res.status(200).json(result);
		})
		.catch(err => {
			res.status(500).json(errorToJSON(err));
			log.error(err);
			throw err;
		});
});

// static content
server.use("/libs", express.static(__dirname + "/node_modules"));
server.use("/", express.static(__dirname + "/public"));

server.use(function (req, res) {
	res.writeHead(301, { "Content-Type": "text/plain", "Location": "/?url=" + req.url });
	res.end();
});

// starts
server.listen(config.server.port, () => {
	log.info("server listening at", config.server.port);
});