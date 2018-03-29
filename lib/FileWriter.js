"use babel";
"use strict";

var path = require('path');
var fs = require('fs');
var ncp = require('ncp').ncp;
ncp.limit = 16;

const Showdown = require('showdown');
const ShellExecutor = require('./ShellExecutor.js');
const elearnExtension = require('./ShowdownElearnJS.js');

class FileWriter {
    constructor() {
        this.bodyConverter = new Showdown.Converter({
            extensions: elearnExtension.elearnHtmlBody(),
        });
        this.imprintConverter = new Showdown.Converter({
            extensions: elearnExtension.elearnImprint(),
        });
    }

    writeHTML() {
        const self = this;

        var text = atom.workspace.getActiveTextEditor().getText();

        var meta = elearnExtension.parseMetaData(text);
        var imprint = "";
        var html = self.bodyConverter.makeHtml(text);

        if(text.match(/\`\`\`imprint[ \t]*\r?\n[\s\S]*?\`\`\`/g)) {
            imprint = self.imprintConverter.makeHtml(text);
        }

        FileWriter.readFile(path.resolve(__dirname + '/../assets/elearnjs/template.html'), (data) => {
            // data => template.html
            var fileContent = data.replace(/\$\$meta\$\$/, () => {return meta})
                .replace(/\$\$imprint\$\$/, () => {return imprint})
                .replace(/\$\$body\$\$/, () => {return html});

            self.saveToFilePath(fileContent);
        }, (err) => {
            throw err;
        });
    }

    writeHTMLPandoc() {
        const self = this;
        ShellExecutor.runPandocHTML(function(o) {
            self.saveToFilePath(o);
        });
    }

    saveToFilePath(content, ignoreAssets) {
        var editor = atom.workspace.getActivePaneItem();
        var file = editor ? editor.buffer.file : undefined;
        var filepath = file.path;
        var split = filepath.split(".");
        split[split.length - 1] = "html";
        var fileOut = split.join(".");

        FileWriter.writeFile(fileOut, content, () => {
            if(ignoreAssets) return;
            // Copy assets
            var pathOut = filepath.split(/[\/\\]+/);
            pathOut[pathOut.length - 1] = "";
            pathOut = pathOut.join("/");

            FileWriter.writeAssets(pathOut, null, (err) => {
                throw err;
            });
        });
    }

    static readFile(filePath, callback, error) {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if(err) return error(err);
            if(callback) callback(data);
        });
    }

    static writeFile(filePath, content, callback, error) {
        fs.writeFile(filePath, content, function(err) {
            if(err) {
                if(error) error(err);
                return;
            }
            if(callback) callback();
        });
    }

    static writeAssets(dirPath, callback, error) {
        ncp(path.resolve(__dirname + '/../assets/elearnjs/assets/'), dirPath + "assets/", function (err) {
            if(err) {
                if(error) error(err);
                return;
            }
            if(callback) callback();
        });
    }
};

export default FileWriter;
