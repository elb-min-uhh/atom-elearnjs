"use babel";
"use strict";

const {dialog} = require('electron').remote;
var path = require('path');
var fs = require('fs');
var ncp = require('ncp').ncp;
ncp.limit = 16;

const EXTRACT_NOTHING = 0;
const EXTRACT_ELEARNJS = 1;
const EXTRACT_ALL_LINKED_FILES = 2;

const Showdown = require('showdown');
const PDF = require('html-pdf');
const OptionMenuManager = require('./OptionMenuManager.js');
const FileExtractor = require('./FileExtractor.js');
const elearnExtension = require('./ShowdownElearnJS.js');

class FileWriter {
    constructor(optionMenuManager) {
        this.optionMenuManager = optionMenuManager;

        this.working = false;
        this.saveLocations = {};
        this.lastHTMLExportOptions = {};
        this.basicConverter = new Showdown.Converter();
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

    /**
    * Starts the conversion process of an HTML conversion.
    * Will be started on "to HTML".
    * Asks for a save location if none is stored.
    */
    writeHTML() {
        const self = this;

        self.openFileChooser("HTML", (filePath) => {
            self.saveHTML(filePath, (err) => {
                if(err) throw err;
            });
        }, true);
    }

    /**
    * Starts the conversion process of an PDF conversion.
    * Will be started on "to PDF".
    * Asks for a save location if none is stored.
    */
    writePDF() {
        const self = this;

        self.openFileChooser("PDF", (filePath) => {
            self.savePDF(filePath, (err) => {
                if(err) throw err;
            });
        }, true);
    }

    /**
    * Starts the conversion process of a selected conversion.
    * Will be started on atom-elearnjs' "Save as..."
    * Always asks for a save location.
    */
    saveAs() {
        const self = this;

        self.openFileChooser(["HTML", "PDF"], (filePath) => {
            if(!filePath) {
                return;
            }

            var fileType = self.getFileType(filePath);

            switch(fileType.toLowerCase()) {
                case "html" :
                    self.saveHTML(filePath, (err) => {
                        if(err) throw err;
                    });
                    break;
                case "pdf" :
                    self.savePDF(filePath, (err) => {
                        if(err) throw err;
                    });
                    break;
                default:
                    atom.notifications.addError("Unsupported file type");
                    break;
            }
        });
    }

    /**
    * Will convert the currently opened file to HTML and store it in the
    * given path.
    * @param filePath string of a filePath including the file name and type.
    * @param callback fnc(error) will be called when the function is done.
    *                 error might be set if an error was thrown.
    */
    saveHTML(filePath, callback) {
        const self = this;

        // no output path -> cancel
        if(!filePath) {
            if(callback) callback();
            return;
        }

        self.openHTMLExportOptions((val, opts) => {
            if(!val) {
                if(callback) callback();
                return;
            }

            var notification = atom.notifications.addInfo("Converting...", {dismissable: true});

            var text = atom.workspace.getActiveTextEditor().getText();

            var meta = elearnExtension.parseMetaData(text);
            var imprint = "";
            var html = self.bodyConverter.makeHtml(text);

            if(text.match(/(?:(?:^|\n)(```+|~~~+)imprint\s*?\n([\s\S]*?)\n\1|(?:^|\n)(<!--+)imprint\s*?\n([\s\S]*?)\n-->)/g)) {
                imprint = self.imprintConverter.makeHtml(text);
            }

            // export linked files
            if(opts.exportLinkedFiles) {
                var pathIn = self.getFileDir();
                var pathOut = self.getFileDir(filePath);

                html = FileExtractor.extractAll(html, pathIn, pathOut);
                meta = FileExtractor.extractAll(meta, pathIn, pathOut);
            }

            FileWriter.readFile(path.resolve(__dirname + '/../assets/elearnjs/template.html'), (data) => {
                // data => template.html
                var fileContent = data.replace(/\$\$meta\$\$/, () => {return meta})
                    .replace(/\$\$imprint\$\$/, () => {return imprint})
                    .replace(/\$\$body\$\$/, () => {return html});

                var extractFiles = opts.exportAssets ? EXTRACT_ELEARNJS : EXTRACT_NOTHING;
                self.saveToFilePath(fileContent, filePath, extractFiles, notification);
                if(callback) callback();
            }, (err) => {
                if(callback) callback(err);
                else throw err;
            });
        });
    }

    /**
    * Will convert the currently opened file to PDF and store it in the
    * given path.
    * @param filePath string of a filePath including the file name and type.
    * @param callback fnc(error) will be called when the function is done.
    *                 error might be set if an error was thrown.
    */
    savePDF(filePath, callback) {
        const self = this;

        if(!filePath) {
            if(callback) callback();
            return;
        }

        var notification = atom.notifications.addInfo("Converting...", {dismissable: true});

        var text = atom.workspace.getActiveTextEditor().getText();

        var meta = elearnExtension.parseMetaData(text);
        var zoom = `<style>html {zoom: ${atom.config.get('atom-elearnjs.pdfConfig.zoom')}}</style>`;
        // header and footer
        var header = atom.config.get('atom-elearnjs.pdfConfig.header');
        if(!header) header = self.getDefaultHeader();
        var footer = atom.config.get('atom-elearnjs.pdfConfig.footer');
        if(!footer) footer = self.getDefaultFooter();

        var customStyleFile = atom.config.get('atom-elearnjs.pdfConfig.customStyle');
        var customStyle;
        if(!customStyleFile || !fs.existsSync(path.resolve(customStyleFile))) {
            customStyle = "";
        }
        else {
            customStyleFile = "file:///" + path.resolve(customStyleFile).replace(/\\/g, "/");
            customStyle = `<link rel="stylesheet" type="text/css" href="${customStyleFile}">`;
        }

        var html = self.pdfBodyConverter.makeHtml(text);

        FileWriter.readFile(path.resolve(__dirname + '/../assets/elearnjs/template_pdf.html'), (data) => {
            // TODO change HTML OUTPUT to better pdf parsable elements (?)
            // data => template.html
            var fileContent = data.replace(/\$\$meta\$\$/, () => {return meta})
                .replace(/\$\$zoom\$\$/, () => {return zoom})
                .replace(/\$\$custom_style\$\$/, () => {return customStyle})
                .replace(/\$\$header\$\$/, () => {return header})
                .replace(/\$\$footer\$\$/, () => {return footer})
                .replace(/\$\$body\$\$/, () => {return html})
                .replace(/\$\$assetspath\$\$/g, () => {return "file:///" + path.resolve(__dirname + '/../assets/elearnjs/').replace(/\\/g, "/")});

            // For debugging only
            //self.saveToFilePath(fileContent, filePath + ".html");

            const renderDelay = atom.config.get('atom-elearnjs.pdfConfig.renderDelay') * 1000;

            // generate pdf content
            var pdf = PDF.create(fileContent, self.getPdfOutputOptions(renderDelay))
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

    getDefaultHeader() {
        return ``;
    }

    getDefaultFooter() {
        return `<div id="pageFooter" style="font-family: Arial, Verdana, sans-serif; color: #666; position: absolute; height: 100%; width: 100%;">
                    <span style="position: absolute; bottom: 0; right: 0">{{page}}</span>
                </div>`; // {{pages}} := maximale Anzahl
    }

    /**
    * Generates the PDF output options for the used node-html-pdf package.
    * @param filePath path to the currently opened file, necessary to link
    *                 included assets.
    * @param renderDelay (optional) delay of rendering by the package in ms.
    */
    getPdfOutputOptions(renderDelay) {
        const self = this;

        if(!renderDelay) renderDelay = 0;

        return {
            // USE OPTIONS HERE
            "format": "A4",
            "base": "file:///" + self.getFileDir(),
            "border": {
                "top": "18mm",            // default is 0, units: mm, cm, in, px
                "right": "23mm",
                "bottom": "18mm",
                "left": "23mm"
            },
            "header": {
                "height": atom.config.get('atom-elearnjs.pdfConfig.headerHeight'),
            },
            "footer": {
                "height": atom.config.get('atom-elearnjs.pdfConfig.footerHeight'),
            },
            "renderDelay": renderDelay,
        };
    }

    /**
    * Will open the Export Options
    * @param callback fnc(val, exportOptions): will be called with the submit
    *                 value (0: cancel, 1: export) and the export options
    */
    openHTMLExportOptions(callback) {
        const self = this;

        if(!callback) return;

        // file selected
        // continue with export options
        var content = document.createElement('div');
        var exportElearnjs = OptionMenuManager.getCheckBoxLabel("Export elearn.js assets",
            self.lastHTMLExportOptions.exportAssets !== undefined ? self.lastHTMLExportOptions.exportAssets : true);
        content.appendChild(exportElearnjs);
        var exportLinkedFiles = OptionMenuManager.getCheckBoxLabel("Export linked files into asset folder (only <img>, <source>, <script>, <link>)",
            self.lastHTMLExportOptions.exportLinkedFiles !== undefined ? self.lastHTMLExportOptions.exportLinkedFiles : true);
        content.appendChild(exportLinkedFiles);

        // open export options
        self.optionMenuManager.open({
            content: content,
            header: "Export Options",
            buttons: ["Cancel", "Export"],
        }, (val) => {
            var exportOptions = {
                exportAssets: exportElearnjs.checkbox.checked,
                exportLinkedFiles: exportLinkedFiles.checkbox.checked,
            };
            if(val) self.lastHTMLExportOptions = exportOptions;
            callback(val, exportOptions);
        });
    }

    /**
    * Opens a filechooser. Might callback with a cached filePath if allowed.
    * @param fileTypes of Type String[] or String. Allowed filetypes. e.g
    *                  "HTML" or ["HTML", "PDF"]
    * @param callback fnc(filePath) called when a file was selected
    *                 (or from cache if `allowQuickSave` is set to true)
    * @param allowQuickSave (optional) can only be set if `fileTypes` is of
    *                       type String because this will only be done if only
    *                       one type is given.
    */
    openFileChooser(fileTypes, callback, allowQuickSave) {
        const self = this;

        if(!callback) return;

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
            fileType = fileTypes.toLowerCase();
            defaultPath = self.getFilePath(fileType.toLowerCase());
            filters.unshift({name: fileTypes, extensions: [fileTypes.toLowerCase()]});
        }

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
                    var fileType = self.getFileType(filePath).toLowerCase();
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

    /**
    * Calculates the full file path of the currenlty opened file.
    * Optionally the type can be changed by using `fileType`
    * @param fileType (optional) String will change the file type in the
    *                 calculated path.
    */
    getFilePath(fileType) {
        var editor = atom.workspace.getActiveTextEditor();
        var file = editor ? editor.buffer.file : undefined;
        var filepath = file.path;
        var split = filepath.split(".");

        if(fileType) {
            split[split.length - 1] = fileType;
        }

        return split.join(".");
    }

    /**
    * Calculates the file type of the currently opened file. Optionally a
    * customized file path can be used.
    * @param filepath (optional) a custom filepath used instead of the
    *                 currently opened file
    */
    getFileType(filepath) {
        if(!filepath) {
            var editor = atom.workspace.getActiveTextEditor();
            var file = editor ? editor.buffer.file : undefined;
            filepath = file.path;
        }
        var split = filepath.split(".");
        return split[split.length - 1];
    }

    /**
    * Calculates the files directory of the currently opened file. Optionally a
    * customized file path can be used.
    * @param filepath (optional) a custom filepath used instead of the
    *                 currently opened file
    */
    getFileDir(filepath) {
        if(!filepath) {
            var editor = atom.workspace.getActiveTextEditor();
            var file = editor ? editor.buffer.file : undefined;
            filepath = file.path;
        }
        var pathOut = filepath.split(/[\/\\]+/);
        pathOut[pathOut.length - 1] = "";
        return pathOut.join("/");
    }

    /**
    * Writes a string into a file of given fileType.
    * @param content the string to write as text into the file.
    * @param filePath the path including the file name and type to write to.
    * @param extractFiles (optional) int: EXTRACT_NOTHING, EXTRACT_ELEARNJS
    * @param notification (optional) a notification to dismiss when done
    */
    saveToFilePath(content, filePath, extractFiles, notification) {
        const self = this;
        var fileOut = filePath;

        var writeFile = () => {
            FileWriter.writeFile(fileOut, content, () => {
                console.log("File saved at:", fileOut);
                if(notification) notification.dismiss();
                atom.notifications.addSuccess("File saved successfully.");
            });
        };

        if(extractFiles === EXTRACT_NOTHING) {
            writeFile();
        }
        else if(extractFiles === EXTRACT_ELEARNJS) {
            var pathOut = self.getFileDir(fileOut);

            FileWriter.writeAssets(pathOut, () => {
                writeFile();
            }, (err) => {
                throw err;
            });
        }
    }

    /**
    * Returns a serialized JSON Object containing necessary information
    * for deserialization.
    */
    serialize() {
        return {
            "saveLocations" : this.saveLocations,
            "lastHTMLExportOptions": this.lastHTMLExportOptions,
        };
    }

    /**
    * Deserializes a given object and restoring previously set variables.
    * @param state a state generated by `FileWriter::serialize()`
    */
    deserialize(state) {
        if(state.saveLocations) this.saveLocations = state.saveLocations;
        if(state.lastHTMLExportOptions) this.lastHTMLExportOptions = state.lastHTMLExportOptions;
    }

    /**
    * Reads in a given file.
    */
    static readFile(filePath, callback, error) {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if(err) return error(err);
            if(callback) callback(data);
        });
    }

    /**
    * Writes the content to a given file.
    */
    static writeFile(filePath, content, callback, error) {
        fs.writeFile(filePath, content, function(err) {
            if(err) {
                if(error) error(err);
                return;
            }
            if(callback) callback();
        });
    }

    /**
    * Writes the elearn.js assets to the given path.
    */
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
