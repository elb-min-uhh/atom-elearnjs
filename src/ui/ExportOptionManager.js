"use babel";

import { PdfExportOptionObject } from 'markdown-elearnjs';
import OptionMenuManager from './OptionMenuManager';

/**
 * Manages the export options, displaying specific menus to the user.
 */
class ExportOptionManager {
    constructor(optionMenuManager) {
        this.optionMenuManager = optionMenuManager;
    }

    /**
    * Will open the Export Options
    * @param defaults object: Contains all default values to be displayed.
    *                 `getHTMLExportOptionDefaults` will return this object.
    * @param forcePrompt bool: if true it will always prompt, even when there
    *                    are cached options available
    * @param outputFile the path to the selected output location, including file name
    */
    async openHTMLExportOptions(defaults, forcePrompt, outputFile) {
        const self = this;

        if(!forcePrompt && self.lastHTMLExportOptions) {
            return { values: self.lastHTMLExportOptions, returnValue: 1 };
        }

        // file selected
        // continue with export options
        let content = self.getHTMLExportOptionsContent(defaults, outputFile);

        // open export options
        let { values, returnValue } = await self.optionMenuManager.open({
            content: content,
            header: "HTML Export Options",
            buttons: ["Cancel", "Export"],
        });
        if(returnValue) {
            self.lastHTMLExportOptions = values;
            delete self.lastHTMLExportOptions.outputFile;
            if(values.displayExportOptions !==
                atom.config.get('atom-elearnjs.generalConfig.displayExportOptions')) {
                atom.config.set('atom-elearnjs.generalConfig.displayExportOptions',
                    values.displayExportOptions);
            }
        }
        return ({ values, returnValue });
    }

    /**
    * Will return an object containing all default values for the
    * options displayed.
    */
    getHTMLExportOptionDefaults(extensionObject) {
        const self = this;

        // Language
        let language = (self.lastHTMLExportOptions &&
            self.lastHTMLExportOptions.language !== undefined) ?
            self.lastHTMLExportOptions.language : "de";

        // Conversion
        let removeComments = (self.lastHTMLExportOptions &&
            self.lastHTMLExportOptions.removeComments !== undefined) ?
            self.lastHTMLExportOptions.removeComments : false;

        // Asset Export
        let exportAssets = (self.lastHTMLExportOptions &&
            self.lastHTMLExportOptions.exportAssets !== undefined) ?
            self.lastHTMLExportOptions.exportAssets : true;
        let exportLinkedFiles = (self.lastHTMLExportOptions &&
            self.lastHTMLExportOptions.exportLinkedFiles !== undefined) ?
            self.lastHTMLExportOptions.exportLinkedFiles : true;

        // Extension Defaults
        let detectionMethod = atom.config.get('atom-elearnjs.generalConfig.detectExtensionsMethod');
        let extensionDefaults = this.getExtensionDefaults(detectionMethod, self.lastHTMLExportOptions, extensionObject);

        // return
        return {
            language: language,
            removeComments: removeComments,
            exportAssets: exportAssets,
            exportLinkedFiles: exportLinkedFiles,
            includeQuiz: extensionDefaults.includeQuiz,
            includeElearnVideo: extensionDefaults.includeElearnVideo,
            includeClickImage: extensionDefaults.includeClickImage,
            includeTimeSlider: extensionDefaults.includeTimeSlider,
            displayExportOptions: atom.config.get('atom-elearnjs.generalConfig.displayExportOptions'),
        };
    }

    /**
    * Will return an object with obj.content being the full HTML content
    * (as dom element) and all specific inputs.
    */
    getHTMLExportOptionsContent(defaults, outputFile) {
        let content = document.createElement('div');

        let body = "";
        body += this.getSaveLocationBlock([".HTML"], outputFile);
        body += this.getLanguageBlock(defaults.language);
        body += this.getConversionBlock(defaults.removeComments);
        body += this.getAssetsExportBlock(
            defaults.exportAssets,
            defaults.exportLinkedFiles);
        body += this.getExtensionsBlock(atom.config.get('atom-elearnjs.generalConfig.detectExtensionsMethod'),
            defaults.includeQuiz,
            defaults.includeElearnVideo,
            defaults.includeClickImage,
            defaults.includeTimeSlider);
        body += this.getGeneralsBlock(defaults.displayExportOptions);

        content.innerHTML = body;
        return content;
    }

    /**
    * Will open the Export Options
    * @param defaults object: Contains all default values to be displayed.
    *                 `getPDFExportOptionDefaults` will return this object.
    * @param forcePrompt bool: if true it will always prompt, even when there
    *                    are cached options available
    * @param outputFile the path to the selected output location, including file name
    */
    async openPDFExportOptions(defaults, forcePrompt, outputFile) {
        const self = this;

        if(!forcePrompt && self.lastPDFExportOptions) {
            return { values: self.lastPDFExportOptions, returnValue: 1 };
        }

        // file selected
        // continue with export options
        let content = self.getPDFExportOptionsContent(defaults, outputFile);

        let { values, returnValue } = await self.optionMenuManager.open({
            content: content,
            header: "PDF Export Options",
            buttons: ["Cancel", "Export"],
        });
        if(values.renderDelay) values.renderDelay *= 1000;
        if(returnValue) {
            self.lastPDFExportOptions = values;
            delete self.lastPDFExportOptions.outputFile;
            if(values.displayExportOptions !==
                atom.config.get('atom-elearnjs.generalConfig.displayExportOptions')) {
                atom.config.set('atom-elearnjs.generalConfig.displayExportOptions',
                    values.displayExportOptions);
            }
        }
        return ({ values, returnValue });
    }

    /**
    * Will return an object containing all default values for the
    * options displayed.
    */
    getPDFExportOptionDefaults(extensionObject) {
        const self = this;

        // Language
        let language = (self.lastPDFExportOptions &&
            self.lastPDFExportOptions.language !== undefined) ?
            self.lastPDFExportOptions.language : "de";

        // Conversion
        let removeComments = (self.lastPDFExportOptions &&
            self.lastPDFExportOptions.removeComments !== undefined) ?
            self.lastPDFExportOptions.removeComments : false;

        // PDF Conversion
        let renderDelay = atom.config.get('atom-elearnjs.pdfConfig.renderDelay');

        // Extension Defaults
        let detectionMethod = atom.config.get('atom-elearnjs.generalConfig.detectExtensionsMethod');
        let extensionDefaults = this.getExtensionDefaults(detectionMethod, self.lastPDFExportOptions, extensionObject);

        // return
        return {
            language: language,
            removeComments: removeComments,
            renderDelay: renderDelay,
            includeQuiz: extensionDefaults.includeQuiz,
            includeElearnVideo: extensionDefaults.includeElearnVideo,
            includeClickImage: extensionDefaults.includeClickImage,
            includeTimeSlider: extensionDefaults.includeTimeSlider,
            displayExportOptions: atom.config.get('atom-elearnjs.generalConfig.displayExportOptions'),
        };
    }

    /**
    * Will return an object with obj.content being the full HTML content
    * (as dom element) and all specific inputs.
    */
    getPDFExportOptionsContent(defaults, outputFile) {
        let content = document.createElement('div');

        let body = "";
        body += this.getSaveLocationBlock([".PDF"], outputFile);
        body += this.getLanguageBlock(defaults.language);
        body += this.getConversionBlock(defaults.removeComments);
        body += this.getPdfConversionBlock(defaults.renderDelay);
        body += this.getExtensionsBlock(atom.config.get('atom-elearnjs.generalConfig.detectExtensionsMethod'),
            defaults.includeQuiz,
            defaults.includeElearnVideo,
            defaults.includeClickImage,
            defaults.includeTimeSlider);
        body += this.getGeneralsBlock(defaults.displayExportOptions);

        content.innerHTML = body;
        return content;
    }

    /**
     *  Creates the generals block.
     * @param defaultDisplayOptions the default value of the displayExportOptions checkbox
     */
    getSaveLocationBlock(fileTypes, defaultOutputFile) {
        let content = "";

        content += OptionMenuManager.createFileChooserLabel(
            "outputFile",
            "",
            fileTypes,
            defaultOutputFile);

        return OptionMenuManager.createBlock("Save Location", content);
    }

    /**
     * Creates the language block.
     * @param defaultLanguage the default value of the language selection
     */
    getLanguageBlock(defaultLanguage) {
        let content = "";

        content += OptionMenuManager.createSelectLabel(
            "language",
            [
                { text: "German", value: "de" },
                { text: "English", value: "en" },
            ],
            defaultLanguage);

        return OptionMenuManager.createBlock("Language", content);
    }

    /**
     *  Creates the conversion block.
     * @param defaultRemoveComments the default value of the removeComments checkbox
     */
    getConversionBlock(defaultRemoveComments) {
        let content = "";

        content += OptionMenuManager.createCheckBoxLabel(
            "removeComments",
            "Remove Html Comments",
            defaultRemoveComments);

        return OptionMenuManager.createBlock("Conversion", content);
    }

    /**
     *  Creates the asset export block.
     * @param defaultExportAssets the default value of the exportAssets checkbox
     * @param defaultExportLinkedFiles the default value of the exportLinkedFiles checkbox
     */
    getAssetsExportBlock(defaultExportAssets, defaultExportLinkedFiles) {
        let content = "";

        content += OptionMenuManager.createCheckBoxLabel(
            "exportAssets",
            "Export elearn.js assets",
            defaultExportAssets);
        content += OptionMenuManager.createCheckBoxLabel(
            "exportLinkedFiles",
            "Export linked files into asset folder (only &lt;img&gt;, &lt;source&gt;, &lt;script&gt;, &lt;link&gt;)",
            defaultExportLinkedFiles);

        return OptionMenuManager.createBlock("Asset exports", content);
    }

    /**
     * Creates the PDF Conversion Block
     * @param defaultRenderDelay the default value of the renderDelay input
     */
    getPdfConversionBlock(defaultRenderDelay) {
        let content = "";

        content += OptionMenuManager.createInputNumberLabel(
            "renderDelay",
            "Render Delay (in seconds)",
            defaultRenderDelay.toString(),
            new PdfExportOptionObject().renderDelay);

        return OptionMenuManager.createBlock("PDF Conversion", content);
    }

    /**
     *  Creates the extension block.
     * @param defaultQuiz the default value of the includeQuiz checkbox
     * @param defaultVideo the default value of the includeElearnVideo checkbox
     * @param defaultClickImage the default value of the includeClickImage checkbox
     * @param defaultTimeslider the default value of the includeTimeSlider checkbox
     */
    getExtensionsBlock(
        method,
        defaultQuiz, defaultVideo,
        defaultClickImage, defaultTimeslider) {
        let content = "";

        content += OptionMenuManager.createDescription(
            `Values defined by Method <em>'${method}'</em>. Check settings to change method.`);
        content += OptionMenuManager.createCheckBoxLabel(
            "includeQuiz",
            "Include quiz.js",
            defaultQuiz);
        content += OptionMenuManager.createCheckBoxLabel(
            "includeElearnVideo",
            "Include elearnvideo.js",
            defaultVideo);
        content += OptionMenuManager.createCheckBoxLabel(
            "includeClickImage",
            "Include clickimage.js",
            defaultClickImage);
        content += OptionMenuManager.createCheckBoxLabel(
            "includeTimeSlider",
            "Include timeslider.js",
            defaultTimeslider);

        return OptionMenuManager.createBlock("Extensions", content);
    }

    /**
     *  Creates the generals block.
     * @param defaultDisplayOptions the default value of the displayExportOptions checkbox
     */
    getGeneralsBlock(defaultDisplayOptions) {
        let content = "";

        content += OptionMenuManager.createCheckBoxLabel(
            "displayExportOptions",
            "Always display export options",
            defaultDisplayOptions);

        return OptionMenuManager.createBlock("General", content);
    }

    /**
     * Calculates wether a extension should be selected for export by default
     * or not, based on the given method. A given set of a previously calculated
     * selection might be given to use if method `auto` is selected.
     * @param method the method name used to detect the extension defaults
     * @param extensions an optional set of extension default values used only
     * if `auto` is selected. If not given and `auto` is used, the values of
     * all extensions will be undefined in the object.
     */
    getExtensionDefaults(detectionMethod, lastValues, extensionObject) {
        let includeQuiz, includeElearnVideo, includeClickImage, includeTimeSlider;

        if(detectionMethod === "on") {
            includeQuiz = includeElearnVideo = includeClickImage = includeTimeSlider = true;
        }
        else if(detectionMethod === "off") {
            includeQuiz = includeElearnVideo = includeClickImage = includeTimeSlider = false;
        }
        else if(detectionMethod === "last" && lastValues) {
            if(lastValues.includeQuiz)
                includeQuiz = lastValues.includeQuiz;
            if(lastValues.includeElearnVideo)
                includeElearnVideo = lastValues.includeElearnVideo;
            if(lastValues.includeClickImage)
                includeClickImage = lastValues.includeClickImage;
            if(lastValues.includeTimeSlider)
                includeTimeSlider = lastValues.includeTimeSlider;
        }
        else if(detectionMethod === "auto" && extensionObject !== undefined) {
            includeQuiz = extensionObject.includeQuiz;
            includeElearnVideo = extensionObject.includeElearnVideo;
            includeClickImage = extensionObject.includeClickImage;
            includeTimeSlider = extensionObject.includeTimeSlider;
        }

        return {
            includeQuiz, includeElearnVideo, includeClickImage, includeTimeSlider
        };
    }

    getExtensionDetectionMethodName(val) {
        switch(val) {
            case "auto": return "Automatic detection";
            case "last": return "Last values";
            case "on": return "Always on";
            case "off": return "Always off";
        }
    }

    /**
    * Returns a serialized JSON Object containing necessary information
    * for deserialization.
    */
    serialize() {
        return {
            "lastHTMLExportOptions": this.lastHTMLExportOptions,
            "lastPDFExportOptions": this.lastPDFExportOptions,
        };
    }

    /**
    * Deserializes a given object and restoring previously set letiables.
    * @param state a state generated by `FileWriter::serialize()`
    */
    deserialize(state) {
        if(atom.config.get('atom-elearnjs.generalConfig.keepExportSettings')) {
            if(state.lastHTMLExportOptions) this.lastHTMLExportOptions = state.lastHTMLExportOptions;
            if(state.lastPDFExportOptions) this.lastPDFExportOptions = state.lastPDFExportOptions;
        }
    }
}

export default ExportOptionManager;
