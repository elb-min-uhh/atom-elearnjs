"use babel";
"use strict";

class ShellExecutor {
    static runPandocHTML(callback) {
        var dir = __dirname + "/../../pandoc/";
        var args = ["-t",
                    dir + "elearnjs_writer.lua",
                    "--template",
                    dir + "template.html"];

        const CP = require('child_process');
        const cp = CP.execFile("pandoc", args, null, function (error, stdout, stderr) {
            if (error) {
                atom.notifications.addError(error.toString(), {
                    stack: error.stack,
                    dismissable: true,
                });
                // TODO REJECT INFO
                //reject(error);
            }
            callback(stdout);
        });
        cp.stdin.write(atom.workspace.getActiveTextEditor().getText());
        cp.stdin.end();
    }
}

export default ShellExecutor;
