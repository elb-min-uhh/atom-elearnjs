"use babel";

import path from 'path';

import { HtmlConverter, PdfConverter, ExtensionManager } from 'markdown-elearnjs';
import ExportOptionManager from '../ui/ExportOptionManager.js';
import Util from '../Util.js';

/**
* Manages the markdown conversion and file export.
*/
class FileWriter {
    constructor(optionMenuManager) {
        this.exportOptionManager = new ExportOptionManager(optionMenuManager);

        this.saveLocations = {
            html: {},
            pdf: {},
        };

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
    * Starts the conversion process of a selected conversion.
    * Will be started on atom-elearnjs' "Save as..."
    * Always asks for a save location.
    */
    async saveAs() {
        const self = this;

        let filePath = await Util.openFileChooser([".HTML", ".PDF"], self.getFilePath(".html"));
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
    * Starts the conversion process of an HTML conversion.
    * Will be started on "to HTML".
    * Asks for a save location if none is stored.
    */
    async writeHTML() {
        const self = this;

        let curPath = self.getFilePath();

        let filePath;
        if(self.saveLocations.html[curPath]) filePath = self.saveLocations.html[curPath];
        else filePath = await Util.openFileChooser(".HTML", self.getFilePath(".html"));

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

        let curPath = self.getFilePath();

        let filePath;
        if(self.saveLocations.pdf[curPath]) filePath = self.saveLocations.pdf[curPath];
        else filePath = await Util.openFileChooser(".PDF", self.getFilePath(".pdf"));
        try {
            await self.savePDF(filePath);
        }
        catch(err) {
            this.notifyError(err);
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
        let curPath = self.getFilePath();

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
            self.saveLocations.html[curPath] = file;
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
        let curPath = self.getFilePath();

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
            self.saveLocations.pdf[curPath] = file;
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
