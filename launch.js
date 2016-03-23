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
        console.error("Exit", port);
    }

    function onWatchRestart(info) {
        console.error("Restaring", port + ".", info.file, info.stat);
    }

    function onRestart() {
        console.error("Restarting script for", child.times, "time");
    }

    function onStart(process) {
        console.log("Start", port);
    }

    var child = new (forever.Monitor)("server.js", childConfig);
    child.on("exit", onExit);
    child.on("watch:restart", onWatchRestart);
    child.on("restart", onRestart);
    child.on("start", onStart);
    return child;
}


var childs = [];
for (var i = 0; i < 2; i++) {
    var child = createChild(3500 + i);
    childs.push(child);
    child.start();
}

process.on('SIGINT', function() {
    console.log("\nShutting down \'node forever\' from SIGINT (Ctrl-C)");
    // some other closing procedures go here
    childs.forEach(function(child) {
        child.stop();
    });
    //
    process.exit();
});