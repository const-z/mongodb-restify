"use strict";

var fs = require("fs");
var mongodb = require("mongodb");
var restify = require("restify");

var DEBUGPREFIX = "DEBUG:";

var Config = require('./modules/config');

var config = new Config("/config.json");

var debug = function (text) {
    if (!config.debug) {
        return;
    }
    if (typeof text === "object") {
        text = JSON.stringify(text);
    }
    console.log("%s %s", DEBUGPREFIX, text);
}

debug(config);

var DataRest = require('./modules/data-rest');
var dataRest = new DataRest(config);

var server = restify.createServer({
    name: "mongodb-restify"
});

server.acceptable = ["application/json"];
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
server.use(restify.fullResponse());
server.use(restify.queryParser());
server.use(restify.jsonp());

let read = (req, res) => {
    dataRest.read(
        req.params.db,
        req.params.collection,
        req.params.id,
        req.query,
        req.params.options, (err, docs) => {
            res.set("content-type", "application/json; charset=utf-8");
            if (err) {
                throw err;
            }
            if (!docs || docs.length == 0) {
                res.json(404);
            } else {
                res.json(200, docs);
            }
        });
};

server.get('/_data/:db/:collection/:id?', read);

server.get('/_data/:db/:collection', read);

server.get("/.*", restify.serveStatic({ directory: "./public", default: "index.html" }));

server.post("/_data/:db/:collection", (req, res) => {
    dataRest.insert(req.params.db, req.params.collection, req.body, (err, result) => {
        res.set("content-type", "application/json; charset=utf-8");
        if (err) {
            throw err;
        }
        res.json(200, result);
    });
}); 

server.put("/_data/:db/:collection/:id", (req, res) => {
    dataRest.update(req.params.db, req.params.collection, req.params.id, req.body, (err, result) => {
        res.set("content-type", "application/json; charset=utf-8");
        if (err) {
            throw err;
        }
        res.json(200, result);
    });
});

server.del("/_data/:db/:collection/:id", (req, res) => {
    dataRest.remove(req.params.db, req.params.collection, req.params.id, (err, result) => {
        res.set("content-type", "application/json; charset=utf-8");
        if (err) {
            throw err;
        }
        res.json(200, result._id);
    });
}); 
 
server.listen(config.server.port, () => {
    console.log("%s listening at %s", server.name, server.url);
});

/*
var test = function (i, max, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', '_data/db4/collection1', true);
	xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
	xhr.send("{\"field1\":\"hello\",    \"field2\":\""+(+new Date())+"\",    \"collection2_id\":{\"name\":\"collection2\"},    \"collection5_id\":{\"name\":\"collection5\",\"collection4_id\":{\"name\":\"collection4\"}},    \"collection3_id\":{\"name\":\"collection3\",\"collection6_id\":{\"name\":\"collection6\"}}}");
	xhr.onreadystatechange = function () { // (3)
		if (xhr.readyState != 4) {
			return;
		}
		if (i === max) {
			console.log("end", + (new Date()));
			return;
		}
		callback(i, max);
	}
}

//case1
var d = new Date();
console.log("start",+d);
function loadtest(i, max){
    test(i+1, max, loadtest);
}

loadtest(0, 10000);

//case2
var d = new Date();
console.log("start",+d);
for (var i=0; i<1000; i++) {
test(i, 999, function(){

});
}
*/