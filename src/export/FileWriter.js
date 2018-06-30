"use babel";
"use strict";

import { remote } from 'electron';
import path from 'path';

import { HtmlConverter, PdfConverter, ExtensionManager } from 'markdown-elearnjs';
import ExportOptionManager from '../ui/ExportOptionManager.js';

const dialog = remote.dialog;

const EXTRACT_NOTHING = 0;
const EXTRACT_ELEARNJS = 1;

/**
* Manages the markdown conversion and file export.
*/
class FileWriter {
    constructor(optionMenuManager) {
        this.exportOptionManager = new ExportOptionManager(optionMenuManager);

        this.saveLocations = {};

        this.htmlConverter = new HtmlConverter();
        this.pdfConverter = new PdfConverter();
    }

    /**
    * Starts the conversion process of an HTML conversion.
    * Will be started on "to HTML".
    * Asks for a save location if none is stored.
    */
    writeHTML() {
        const self = this;

        self.openFileChooser(".HTML", (filePath) => {
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

        self.openFileChooser(".PDF", (filePath) => {
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

        self.openFileChooser([".HTML", ".PDF"], (filePath) => {
            if(!filePath) {
                return;
            }

            let fileType = self.getFileType(filePath);

            switch(fileType.toLowerCase()) {
                case ".html":
                    self.saveHTML(filePath, (err) => {
                        if(err) throw err;
                    });
                    break;
                case ".pdf":
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

        self.htmlConverter.setOptions(self.getHtmlConverterOptions());
        let text = atom.workspace.getActiveTextEditor().getText();
        ExtensionManager.scanMarkdownForAll(text, self.htmlConverter).then((extensionObject) => {
            self.exportOptionManager.openHTMLExportOptions(
                self.exportOptionManager.getHTMLExportOptionDefaults(extensionObject),
                atom.config.get('atom-elearnjs.generalConfig.displayExportOptions'),
                (val, opts) => {
                    if(!val) {
                        if(callback) callback();
                        return;
                    }

                    let notification = atom.notifications.addInfo("Converting...", { dismissable: true });

                    // define finishing functions
                    let resolve = () => {
                        if(notification) notification.dismiss();
                        atom.notifications.addSuccess("File saved successfully.");
                        if(callback) callback();
                    };
                    let reject = (err) => {
                        if(notification) notification.dismiss();
                        if(callback) callback(err);
                        else throw err;
                    };

                    // write to file
                    self.exportHTML(filePath, text, opts, resolve, reject);
                });
        }, (err) => {
            if(callback) callback(err);
            else throw err;
        });
    }

    /**
    * Creates an HTML Converter with current settings.
    */
    getHtmlConverterOptions() {
        return {
            "newSectionOnHeading": atom.config.get('atom-elearnjs.generalConfig.newSectionOnHeading'),
            "headingDepth": atom.config.get('atom-elearnjs.generalConfig.newSectionOnHeadingDepth'),
            "useSubSections": atom.config.get('atom-elearnjs.generalConfig.sectionOrder.useSectionLevel'),
            "subSectionLevel": atom.config.get('atom-elearnjs.generalConfig.sectionOrder.sub'),
            "subsubSectionLevel": atom.config.get('atom-elearnjs.generalConfig.sectionOrder.subsub'),
        };
    }

    /**
    * Exports the converted content into a file.
    * Based on options and filesToExport it will also export/copy additional
    * files.
    *
    * @param filePath: the path where the .html output file is stored (including name)
    * @param text: the markdown source code
    * @param opts: the ExportOptions from the ExportOptionManager
    * @param resolve: function() to be called when resolved correctly
    * @param reject: function(error) to be called on error
    */
    exportHTML(filePath, text, opts, resolve, reject) {
        const self = this;

        let extractFiles = opts.exportAssets ? EXTRACT_ELEARNJS : EXTRACT_NOTHING;
        self.htmlConverter.toFile(text, filePath, self.getFileDir(), opts, true).then((res) => {
            console.log("File saved at:", res);
            resolve();
        }, (err) => {
            reject(err);
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

        self.pdfConverter.setOptions(self.getPdfConverterOptions());
        let text = atom.workspace.getActiveTextEditor().getText();
        ExtensionManager.scanMarkdownForAll(text, self.pdfConverter).then((extensionObject) => {
            self.exportOptionManager.openPDFExportOptions(
                self.exportOptionManager.getPDFExportOptionDefaults(extensionObject),
                atom.config.get('atom-elearnjs.generalConfig.displayExportOptions'),
                (val, opts) => {
                    if(!val) {
                        if(callback) callback();
                        return;
                    }

                    let notification = atom.notifications.addInfo("Converting...", { dismissable: true });

                    // define finishing functions
                    let resolve = () => {
                        if(notification) notification.dismiss();
                        atom.notifications.addSuccess("File saved successfully.");
                        if(callback) callback();
                    };
                    let reject = (err) => {
                        if(notification) notification.dismiss();
                        if(callback) callback(err);
                        else throw err;
                    };

                    // conversion
                    self.exportPDF(filePath, text, opts, resolve, reject);
                });
        }, (err) => {
            if(callback) callback(err);
            else throw err;
        });
    }

    /**
    * Creates an PDF Converter with current settings.
    */
    getPdfConverterOptions() {
        return {
            "newSectionOnHeading": atom.config.get('atom-elearnjs.generalConfig.newSectionOnHeading'),
            "headingDepth": atom.config.get('atom-elearnjs.generalConfig.newSectionOnHeadingDepth'),
            "useSubSections": atom.config.get('atom-elearnjs.generalConfig.sectionOrder.useSectionLevel'),
            "subSectionLevel": atom.config.get('atom-elearnjs.generalConfig.sectionOrder.sub'),
            "subsubSectionLevel": atom.config.get('atom-elearnjs.generalConfig.sectionOrder.subsub'),
            "newPageOnSection": atom.config.get('atom-elearnjs.pdfConfig.newPageOnSection'),
            "contentZoom": atom.config.get('atom-elearnjs.pdfConfig.zoom'),
            "customHeader": atom.config.get('atom-elearnjs.pdfConfig.header'),
            "headerHeight": atom.config.get('atom-elearnjs.pdfConfig.headerHeight'),
            "customFooter": atom.config.get('atom-elearnjs.pdfConfig.footer'),
            "footerHeight": atom.config.get('atom-elearnjs.pdfConfig.footerHeight'),
            "customStyleFile": atom.config.get('atom-elearnjs.pdfConfig.customStyle'),
        };
    }

    /**
    * Exports the converted content into a file.
    * Based on options and filesToExport it will also export/copy additional
    * files.
    *
    * @param filePath: the path where the .html output file is stored (including name)
    * @param text: the markdown source code
    * @param opts: the ExportOptions from the ExportOptionManager
    * @param resolve: function() to be called when resolved correctly
    * @param reject: function(error) to be called on error
    */
    exportPDF(filePath, text, opts, resolve, reject) {
        const self = this;

        opts.renderDelay = atom.config.get('atom-elearnjs.pdfConfig.renderDelay') * 1000;
        self.pdfConverter.toFile(text, filePath, self.getFileDir(), opts, true).then((res) => {
            console.log("File saved at:", res);
            resolve();
        }, (err) => {
            reject(err);
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

        let fileType = "";
        let defaultPath = "";
        let filters = [{ name: "All Files", extensions: ["*"] }];

        // array of filetypes
        if(Object.prototype.toString.call(fileTypes) === '[object Array]') {
            allowQuickSave = false;
            defaultPath = self.getFilePath(fileTypes[0].toLowerCase());

            let newFilters = [];
            for(let type of fileTypes) {
                newFilters.push({ name: type.substr(1), extensions: [type.toLowerCase().substr(1)] });
            }
            newFilters.push(filters[0]);
            filters = newFilters;
        }
        // single filetype as string
        else {
            fileType = fileTypes.toLowerCase();
            defaultPath = self.getFilePath(fileType.toLowerCase());
            filters.unshift({ name: fileTypes.substr(1), extensions: [fileTypes.substr(1).toLowerCase()] });
        }

        let curPath = self.getFilePath();

        if(allowQuickSave &&
            curPath !== undefined &&
            self.saveLocations[curPath] &&
            self.saveLocations[curPath][fileType]) {
            callback(self.saveLocations[curPath][fileType]);
        }
        else {
            dialog.showSaveDialog({
                defaultPath: defaultPath,
                filters: filters,
            }, (filePath) => {
                if(filePath) {
                    let fileType = self.getFileType(filePath).toLowerCase();
                    if(curPath !== undefined) {
                        if(!self.saveLocations[curPath]) self.saveLocations[curPath] = {};
                        self.saveLocations[curPath][fileType] = filePath;
                    }
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
        let editor = atom.workspace.getActiveTextEditor();
        let file = editor ? editor.buffer.file : undefined;
        if(!file) return undefined;
        let filepath = file.path;
        let split = filepath.split(".");

        if(fileType) {
            split[split.length - 1] = fileType.substr(1);
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
            let editor = atom.workspace.getActiveTextEditor();
            let file = editor ? editor.buffer.file : undefined;
            if(!file) return undefined;
            filepath = file.path;
        }
        return path.extname(filepath);
    }

    /**
    * Calculates the files directory of the currently opened file. Optionally a
    * customized file path can be used.
    * @param filepath (optional) a custom filepath used instead of the
    *                 currently opened file
    */
    getFileDir(filepath) {
        if(!filepath) {
            let editor = atom.workspace.getActiveTextEditor();
            let file = editor ? editor.buffer.file : undefined;
            if(!file) return undefined;
            filepath = file.path;
        }
        return path.dirname(filepath);
    }

    /**
    * Returns a serialized JSON Object containing necessary information
    * for deserialization.
    */
    serialize() {
        return {
            "saveLocations": this.saveLocations,
            "exportOptionManager": this.exportOptionManager.serialize(),
        };
    }

    /**
    * Deserializes a given object and restoring previously set letiables.
    * @param state a state generated by `FileWriter::serialize()`
    */
    deserialize(state) {
        if(atom.config.get('atom-elearnjs.generalConfig.keepSaveLocations') &&
            state.saveLocations) this.saveLocations = state.saveLocations;
        if(state.exportOptionManager)
            this.exportOptionManager.deserialize(state.exportOptionManager);
    }
}

export default FileWriter;
