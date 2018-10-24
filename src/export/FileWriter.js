"use babel";
"use strict";

import { remote } from 'electron';
import path from 'path';

import { HtmlConverter, PdfConverter, ExtensionManager } from 'markdown-elearnjs';
import ExportOptionManager from '../ui/ExportOptionManager.js';

const dialog = remote.dialog;

/**
* Manages the markdown conversion and file export.
*/
class FileWriter {
    constructor(optionMenuManager) {
        this.exportOptionManager = new ExportOptionManager(optionMenuManager);

        this.saveLocations = {};

        this.htmlConverter = new HtmlConverter();
        this.pdfConverter = new PdfConverter({
            keepChromeAlive: atom.config.get('atom-elearnjs.pdfConfig.keepChromeAlive'),
        });

        this.initializeConfigObservers();
    }

    initializeConfigObservers() {
        atom.config.observe('atom-elearnjs.pdfConfig.keepChromeAlive', (val) => {
            this.pdfConverter.setOption("keepChromeAlive", val);
        });
    }

    /**
    * Starts the conversion process of an HTML conversion.
    * Will be started on "to HTML".
    * Asks for a save location if none is stored.
    */
    async writeHTML() {
        const self = this;

        let filePath = await self.openFileChooser(".HTML", true);
        try {
            await self.saveHTML(filePath);
        }
        catch(err) {
            this.notifyError(err);
        }
    }

    /**
    * Starts the conversion process of an PDF conversion.
    * Will be started on "to PDF".
    * Asks for a save location if none is stored.
    */
    async writePDF() {
        const self = this;

        let filePath = await self.openFileChooser(".PDF", true);
        try {
            await self.savePDF(filePath);
        }
        catch(err) {
            this.notifyError(err);
        }
    }

    /**
    * Starts the conversion process of a selected conversion.
    * Will be started on atom-elearnjs' "Save as..."
    * Always asks for a save location.
    */
    async saveAs() {
        const self = this;

        let filePath = await self.openFileChooser([".HTML", ".PDF"]);
        if(!filePath) {
            return;
        }

        let fileType = self.getFileType(filePath);

        switch(fileType.toLowerCase()) {
            case ".html":
                self.saveHTML(filePath).then().catch((err) => {
                    if(err) this.notifyError(err);
                });
                break;
            case ".pdf":
                self.savePDF(filePath).then().catch((err) => {
                    if(err) this.notifyError(err);
                });
                break;
            default:
                atom.notifications.addError("Unsupported file type.");
                break;
        }
    }

    /**
    * Will convert the currently opened file to HTML and store it in the
    * given path.
    * @param filePath string of a filePath including the file name and type.
    */
    async saveHTML(filePath) {
        const self = this;

        // no output path -> cancel
        if(!filePath) {
            return;
        }

        self.htmlConverter.setOptions(self.getHtmlConverterOptions());

        let text = atom.workspace.getActiveTextEditor().getText();
        // scan for extensions
        let extensionObject = await ExtensionManager.scanMarkdownForAll(text, self.htmlConverter);
        // prompt export options
        let { values, returnValue } = await self.exportOptionManager.openHTMLExportOptions(
            self.exportOptionManager.getHTMLExportOptionDefaults(extensionObject),
            atom.config.get('atom-elearnjs.generalConfig.displayExportOptions'));

        if(!returnValue) {
            return;
        }

        let notification = atom.notifications.addInfo("Converting...", { dismissable: true });

        try {
            let file = await self.htmlConverter.toFile(text, filePath, self.getFileDir(), values, true);
            console.log(`Saved at ${file}`);
            if(notification) notification.dismiss();
            atom.notifications.addSuccess("File saved successfully.");
        } catch(err) {
            if(notification) notification.dismiss();
            throw err;
        }
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
    * Will convert the currently opened file to PDF and store it in the
    * given path.
    * @param filePath string of a filePath including the file name and type.
    */
    async savePDF(filePath) {
        const self = this;

        if(!filePath) {
            return;
        }

        self.pdfConverter.setOptions(self.getPdfConverterOptions());

        let text = atom.workspace.getActiveTextEditor().getText();
        // scan for extensions
        let extensionObject = await ExtensionManager.scanMarkdownForAll(text, self.pdfConverter);
        // prompt export options
        let { values, returnValue } = await self.exportOptionManager.openPDFExportOptions(
            self.exportOptionManager.getPDFExportOptionDefaults(extensionObject),
            atom.config.get('atom-elearnjs.generalConfig.displayExportOptions'));

        if(!returnValue) {
            return;
        }

        let notification = atom.notifications.addInfo("Converting...", { dismissable: true });

        // conversion
        try {
            let file = await self.pdfConverter.toFile(text, filePath, self.getFileDir(), values, true);
            console.log(`Saved at ${file}`);
            if(notification) notification.dismiss();
            atom.notifications.addSuccess("File saved successfully.");
        } catch(err) {
            if(notification) notification.dismiss();
            throw err;
        }
    }

    /**
    * Creates an PDF Converter with current settings.
    */
    getPdfConverterOptions() {
        let options = {
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
            "chromePath": atom.config.get('atom-elearnjs.pdfConfig.chromePath'),
        };

        if(options.chromePath === '') options.chromePath = undefined;

        return options;
    }

    /**
    * Opens a filechooser. Might return a cached filePath if allowed.
    * @param fileTypes of Type String[] or String. Allowed filetypes. e.g
    *                  "HTML" or ["HTML", "PDF"]
    * @param allowQuickSave (optional) can only be set if `fileTypes` is of
    *                       type String because this will only be done if only
    *                       one type is given.
    */
    async openFileChooser(fileTypes, allowQuickSave) {
        const self = this;

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
            return self.saveLocations[curPath][fileType];
        }
        else {
            let filePath = await new Promise((res) => {
                dialog.showSaveDialog({
                    defaultPath: defaultPath,
                    filters: filters,
                }, res);
            });
            let fileType = self.getFileType(filePath).toLowerCase();
            if(curPath !== undefined) {
                if(!self.saveLocations[curPath]) self.saveLocations[curPath] = {};
                self.saveLocations[curPath][fileType] = filePath;
            }
            console.log("File Save Location set", "type:", fileType,
                "of:", curPath,
                "to:", filePath);

            return filePath;
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
     * Notifies the errors if known.
     * @param {*} error
     */
    notifyError(error) {
        let options = {
            detail: error.toString(),
            dismissable: true,
        };

        if(error.code === "EBUSY") {
            options.description = "The file could not be saved. It seems to be opened by another process.";
        }

        atom.notifications.addError("Could not save the file", options);
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
