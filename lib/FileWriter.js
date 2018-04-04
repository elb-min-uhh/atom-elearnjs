"use babel";
"use strict";

const {dialog} = require('electron').remote;
var path = require('path');
var fs = require('fs');
var ncp = require('ncp').ncp;
ncp.limit = 16;

const Showdown = require('showdown');
const PDF = require('html-pdf');
const elearnExtension = require('./ShowdownElearnJS.js');

class FileWriter {
    constructor() {
        this.working = false;
        this.saveLocations = {};
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

        // Check Lock
        if(self.working) return;
        self.working = true;

        self.openFileChooser("HTML", (filePath) => {
            self.saveHTML(filePath, (err) => {
                self.working = false;
                if(err) throw err;
            });
        }, true);
    }

    writePDF() {
        const self = this;

        // Check Lock
        if(self.working) return;
        self.working = true;

        self.openFileChooser("PDF", (filePath) => {
            self.savePDF(filePath, (err) => {
                self.working = false;
                if(err) throw err;
            });
        }, true);
    }

    saveAs() {
        const self = this;

        // Check Lock
        if(self.working) return;
        self.working = true;

        self.openFileChooser(["HTML", "PDF"], (filePath) => {
            if(!filePath) {
                self.working = false; // unlock
                return;
            }

            var fileType = self.getFileType(filePath);

            switch(fileType.toLowerCase()) {
                case "html" :
                    self.saveHTML(filePath, (err) => {
                        self.working = false;
                        if(err) throw err;
                    });
                    break;
                case "pdf" :
                    self.savePDF(filePath, (err) => {
                        self.working = false;
                        if(err) throw err;
                    });
                    break;
                default:
                    atom.notifications.addError("Unsupported file type");
                    self.working = false;
                    break;
            }
        });
    }

    saveHTML(filePath, callback) {
        const self = this;

        if(!filePath) {
            if(callback) callback();
        }

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

            self.saveToFilePath(fileContent, "html", false, notification, filePath);
            if(callback) callback();
        }, (err) => {
            if(callback) callback(err);
            else throw err;
        });
    }

    savePDF(filePath, callback) {
        const self = this;

        if(!filePath) {
            if(callback) callback();
        }

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
            //self.saveToFilePath(fileContent, "html", false, null, filePath);

            const renderDelay = atom.config.get('atom-elearnjs.pdfConfig.renderDelay') * 1000;

            // generate pdf content
            var pdf = PDF.create(fileContent, self.getPdfOutputOptions(filePath, renderDelay))
                    .toFile(filePath, (err, res) => {
                if(err) {
                    if(callback) callback(err);
                    else throw err;
                }

                console.log("File saved at:", res);
                notification.dismiss();
                atom.notifications.addSuccess("File saved successfully.");
                if(callback) callback();
            });
        }, (err) => {
            if(callback) callback(err);
            else throw err;
        });
    }

    getPdfOutputOptions(filePath, renderDelay) {
        const self = this;

        return {
            // USE OPTIONS HERE
            "format": "A4",
            "base": "file:///" + self.getFileDir(filePath),
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
        };
    }

    openFileChooser(fileTypes, callback, allowQuickSave) {
        const self = this;

        var fileType = "";
        var defaultPath = "";
        var filters = [{name: "All Files", extensions: ["*"]}];

        // array of filetypes
        if(Object.prototype.toString.call(fileTypes) === '[object Array]') {
            allowQuickSave = false;
            defaultPath = self.getFilePath(fileTypes[0].toLowerCase());

            var newFilters = [];
            for(var type of fileTypes) {
                newFilters.push({name: type, extensions: [type.toLowerCase()]});
            }
            newFilters.push(filters[0]);

            filters = newFilters;
        }
        // single filetype as string
        else {
            fileType = fileTypes;
            defaultPath = self.getFilePath(fileType.toLowerCase());
        }

        if(!callback) return;
        var curPath = self.getFilePath();

        if(allowQuickSave
                && self.saveLocations[curPath]
                && self.saveLocations[curPath][fileType]) {
            callback(self.saveLocations[curPath][fileType]);
        }
        else {
            dialog.showSaveDialog({
                defaultPath: defaultPath,
                filters: filters,
            }, (filePath) => {
                if(filePath) {
                    var fileType = self.getFileType(filePath);
                    if(!self.saveLocations[curPath]) self.saveLocations[curPath] = {};
                    self.saveLocations[curPath][fileType] = filePath;
                    console.log("File Save Location set", "type:", fileType,
                                "of:", curPath,
                                "to:", filePath);
                }
                callback(filePath);
            });
        }
    }

    getFilePath(fileType) {
        var editor = atom.workspace.getActivePaneItem();
        var file = editor ? editor.buffer.file : undefined;
        var filepath = file.path;
        var split = filepath.split(".");

        if(fileType) {
            split[split.length - 1] = fileType;
        }

        return split.join(".");
    }

    getFileType(filepath) {
        if(!filepath) {
            var editor = atom.workspace.getActivePaneItem();
            var file = editor ? editor.buffer.file : undefined;
            filepath = file.path;
        }
        var split = filepath.split(".");
        return split[split.length - 1];
    }

    getFileDir(filepath) {
        if(!filepath) {
            var editor = atom.workspace.getActivePaneItem();
            var file = editor ? editor.buffer.file : undefined;
            filepath = file.path;
        }
        var pathOut = filepath.split(/[\/\\]+/);
        pathOut[pathOut.length - 1] = "";
        return pathOut.join("/");
    }

    saveToFilePath(content, fileType, ignoreAssets, notification, filePath) {
        const self = this;
        var fileOut = filePath ? filePath : self.getFilePath(fileType);

        FileWriter.writeFile(fileOut, content, () => {
            if(ignoreAssets) return;
            // Copy assets
            var pathOut = self.getFileDir(fileOut);

            FileWriter.writeAssets(pathOut, null, (err) => {
                throw err;
            });

            console.log("File saved at:", fileOut);
            if(notification) notification.dismiss();
            atom.notifications.addSuccess("File saved successfully.");
        });
    }

    serialize() {
        return {
            "saveLocations" : this.saveLocations,
        };
    }

    deserialize(state) {
        console.debug("Deserialized FileWriter");
        this.saveLocations = state.saveLocations;
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
