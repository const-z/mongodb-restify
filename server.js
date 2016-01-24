var fs = require("fs");
var mongodb = require("mongodb");
var restify = module.exports.restify = require("restify");

var DEBUGPREFIX = "DEBUG: ";

var config = {
  "db": {
    "port": 27017,
    "host": "localhost"
  },
  "server": {
    "port": 3500,
    "address": "0.0.0.0"
  },
  "flavor": "mongodb",
  "debug": false
};

var debug = module.exports.debug = function (str) {
  if (config.debug) {
    console.log(DEBUGPREFIX + str);
  }
};

try {
  config = JSON.parse(fs.readFileSync(process.cwd() + "/config.json"));
} catch (e) {
  debug("No config.json file found. Fall back to default config.");
}

module.exports.config = config;

var server = restify.createServer({
//   certificate: fs.readFileSync('d:\\projects\\openssl-0.9.8k_X64\\bin\\public.pem'),
//   key: fs.readFileSync('d:\\projects\\openssl-0.9.8k_X64\\bin\\private.pem'),
  name: "mongodb-restify"
});
server.acceptable = ['application/json'];
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
server.use(restify.fullResponse());
server.use(restify.queryParser());
server.use(restify.jsonp());

module.exports.server = server;

require('./modules/rest');

server.listen(config.server.port, function () {
  console.log("%s listening at %s", server.name, server.url);
});