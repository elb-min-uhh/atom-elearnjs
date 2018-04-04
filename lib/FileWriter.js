"use babel";
"use strict";

var path = require('path');
var fs = require('fs');
var ncp = require('ncp').ncp;
ncp.limit = 16;

const Showdown = require('showdown');
const PDF = require('html-pdf');
const ShellExecutor = require('./ShellExecutor.js');
const elearnExtension = require('./ShowdownElearnJS.js');

class FileWriter {
    constructor() {
        this.bodyConverter = new Showdown.Converter({
            extensions: elearnExtension.elearnHtmlBody(),
        });
        this.pdfBodyConverter = new Showdown.Converter({
            extensions: elearnExtension.elearnPdfBody(),
        });
        this.imprintConverter = new Showdown.Converter({
            extensions: elearnExtension.elearnImprint(),
        });
    }

    writeHTML() {
        const self = this;

        var notification = atom.notifications.addInfo("Converting...", {dismissable: true});

        var text = atom.workspace.getActiveTextEditor().getText();

        var meta = elearnExtension.parseMetaData(text);
        var imprint = "";
        var html = self.bodyConverter.makeHtml(text);

        if(text.match(/(?:(?:^|\n)(```+|~~~+)imprint\s*?\n([\s\S]*?)\n\1|(?:^|\n)(<!--+)imprint\s*?\n([\s\S]*?)\n-->)/g)) {
            imprint = self.imprintConverter.makeHtml(text);
        }

        FileWriter.readFile(path.resolve(__dirname + '/../assets/elearnjs/template.html'), (data) => {
            // data => template.html
            var fileContent = data.replace(/\$\$meta\$\$/, () => {return meta})
                .replace(/\$\$imprint\$\$/, () => {return imprint})
                .replace(/\$\$body\$\$/, () => {return html});

            self.saveToFilePath(fileContent, "html", false, notification);
        }, (err) => {
            throw err;
        });
    }

    writePDF() {
        const self = this;

        var notification = atom.notifications.addInfo("Converting...", {dismissable: true});

        var text = atom.workspace.getActiveTextEditor().getText();

        var meta = elearnExtension.parseMetaData(text);
        var zoom = `<style>html {zoom: ${atom.config.get('atom-elearnjs.pdfConfig.zoom')}}</style>`;
        var html = self.pdfBodyConverter.makeHtml(text);

        FileWriter.readFile(path.resolve(__dirname + '/../assets/elearnjs/template_pdf.html'), (data) => {
            // TODO change HTML OUTPUT to better pdf parsable elements (?)
            // data => template.html
            var fileContent = data.replace(/\$\$meta\$\$/, () => {return meta})
                .replace(/\$\$zoom\$\$/, () => {return zoom})
                .replace(/\$\$body\$\$/, () => {return html})
                .replace(/\$\$assetspath\$\$/g, () => {return "file:///" + path.resolve(__dirname + '/../assets/elearnjs/').replace(/\\/g, "/")});

            // For debugging only
            //self.saveToFilePath(fileContent, "html");

            const renderDelay = atom.config.get('atom-elearnjs.pdfConfig.renderDelay') * 1000;

            // generate pdf content
            var pdf = PDF.create(fileContent, {
                // USE OPTIONS HERE
                "format": "A4",
                "base": "file:///" + self.getFileDir(),
                "border": {
                    "top": "18mm",            // default is 0, units: mm, cm, in, px
                    "right": "23mm",
                    "bottom": "18mm",
                    "left": "23mm"
                },
                "footer": {
                    "height": "17mm",
                    "contents": {
                        default: `<div style="font-family: Arial, Verdana, sans-serif; color: #666; position: absolute; height: 100%; width: 100%;">
                                    <span style="position: absolute; bottom: 0; right: 0">{{page}}</span>
                                </div>`, // fallback value {{pages}} := maximale Anzahl
                    }
                },
                "renderDelay": renderDelay,
            }).toFile(self.getFilePath("pdf"), (err, res) => {
                if(err) throw err;

                console.log("File saved at:", res);
                notification.dismiss();
                atom.notifications.addSuccess("File saved successfully.");
            });
        }, (err) => {
            throw err;
        });
    }

    writeHTMLPandoc() {
        const self = this;
        ShellExecutor.runPandocHTML(function(o) {
            self.saveToFilePath(o, "html");
        });
    }

    getFilePath(fileType) {
        var editor = atom.workspace.getActivePaneItem();
        var file = editor ? editor.buffer.file : undefined;
        var filepath = file.path;
        var split = filepath.split(".");
        split[split.length - 1] = fileType;
        return split.join(".");
    }

    getFileDir() {
        var editor = atom.workspace.getActivePaneItem();
        var file = editor ? editor.buffer.file : undefined;
        var filepath = file.path;
        var pathOut = filepath.split(/[\/\\]+/);
        pathOut[pathOut.length - 1] = "";
        return pathOut.join("/");
    }

    saveToFilePath(content, fileType, ignoreAssets, notification) {
        const self = this;
        var fileOut = self.getFilePath(fileType);

        FileWriter.writeFile(fileOut, content, () => {
            if(ignoreAssets) return;
            // Copy assets
            var pathOut = self.getFileDir();

            FileWriter.writeAssets(pathOut, null, (err) => {
                throw err;
            });

            console.log("File saved at:", fileOut);
            if(notification) notification.dismiss();
            atom.notifications.addSuccess("File saved successfully.");
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
