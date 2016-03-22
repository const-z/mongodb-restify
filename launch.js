var forever = require("forever-monitor");

function createChild(port) {

    var childConfig = {
        max: 3,
        silent: false,
        args: ["--port=" + port],
        killTree: true,
        watch: true,
        watchDirectory: __dirname,
        watchIgnoreDotFiles: null,
        watchIgnorePatterns: ["*.log", "launch.js", "public/**/*", "node_modules/**/*"]
    };

    function onExit() {
        console.error("server.js has exited");
    }

    function onWatchRestart(info) {
        console.error("Restaring.", info.file, info.stat);
    }

    function onRestart() {
        console.error("Restarting script for " + child.times + " time");
    }

    function onStart(process) {
        console.log("Start", process.uid);
    }

    var child = new (forever.Monitor)("server.js", childConfig);
    child.on("exit", onExit);
    child.on("watch:restart", onWatchRestart);
    child.on("restart", onRestart);
    child.on("start", onStart);
    return child;
}

var child = createChild(3500);
child.start();

var child2 = createChild(3600);
child2.start();