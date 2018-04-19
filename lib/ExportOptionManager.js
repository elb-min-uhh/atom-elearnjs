"use strict";

const OptionMenuManager = require('./OptionMenuManager.js');
const ExtensionManager = require('./ExtensionManager.js');

class ExportOptionManager {
    constructor(optionMenuManager) {
        this.optionMenuManager = optionMenuManager;
    }

    /**
    * Will open the Export Options
    * @param forcePrompt bool: if true it will always prompt, even when there
    *                    are cached options available
    * @param callback fnc(val, exportOptions): will be called with the submit
    *                 value (0: cancel, 1: export) and the export options
    */
    openHTMLExportOptions(defaults, forcePrompt, callback) {
        const self = this;

        if(!callback) return;

        if(!forcePrompt && self.lastHTMLExportOptions) {
            callback(1, self.lastHTMLExportOptions);
            return;
        }

        // file selected
        // continue with export options
        var contentObj = self.getHTMLExportOptionsContent(defaults);

        // open export options
        self.optionMenuManager.open({
            content: contentObj.content,
            header: "Export Options",
            buttons: ["Cancel", "Export"],
        }, (val) => {
            var exportOptions = self.parseHTMLExportOptions(contentObj);
            if(val) {
                self.lastHTMLExportOptions = exportOptions;
                if(exportOptions.displayExportOptions
                        !== atom.config.get('atom-elearnjs.generalConfig.displayExportOptions')) {
                    atom.config.set('atom-elearnjs.generalConfig.displayExportOptions',
                        exportOptions.displayExportOptions);
                }
            }
            callback(val, exportOptions);
        });
    }

    /**
    * Will return an object containing all default values for the
    * options displayed.
    */
    getHTMLExportOptionDefaults(html) {
        const self = this;

        var exportElearnjs = (self.lastHTMLExportOptions
            && self.lastHTMLExportOptions.exportAssets !== undefined)
            ? self.lastHTMLExportOptions.exportAssets : true;

        var exportLinkedFiles = (self.lastHTMLExportOptions
            && self.lastHTMLExportOptions.exportLinkedFiles !== undefined)
            ? self.lastHTMLExportOptions.exportLinkedFiles : true;

        // Extension Defaults
        var detectionMethod = atom.config.get('atom-elearnjs.generalConfig.detectExtensionsMethod');
        var includeQuiz, includeElearnVideo, includeClickImage, includeTimeSlider;
        if(detectionMethod === "on") {
            includeQuiz = includeElearnVideo = includeClickImage = includeTimeSlider = true;
        }
        else if(detectionMethod === "off") {
            includeQuiz = includeElearnVideo = includeClickImage = includeTimeSlider = false;
        }
        else if(detectionMethod === "last" && self.lastHTMLExportOptions) {
            if(self.lastHTMLExportOptions.includeQuiz)
                includeQuiz = self.lastHTMLExportOptions.includeQuiz;
            if(self.lastHTMLExportOptions.includeElearnVideo)
                includeElearnVideo = self.lastHTMLExportOptions.includeElearnVideo;
            if(self.lastHTMLExportOptions.includeClickImage)
                includeClickImage = self.lastHTMLExportOptions.includeClickImage;
            if(self.lastHTMLExportOptions.includeTimeSlider)
                includeTimeSlider = self.lastHTMLExportOptions.includeTimeSlider;
        }
        else if(detectionMethod === "auto") {
            includeQuiz = ExtensionManager.scanForQuiz(html);
            includeElearnVideo = ExtensionManager.scanForVideo(html);
            includeClickImage = ExtensionManager.scanForClickImage(html);
            includeTimeSlider = ExtensionManager.scanForTimeSlider(html);
        }

        // return
        return {
            exportElearnjs: exportElearnjs,
            exportLinkedFiles: exportLinkedFiles,
            includeQuiz: includeQuiz,
            includeElearnVideo: includeElearnVideo,
            includeClickImage: includeClickImage,
            includeTimeSlider: includeTimeSlider,
            displayExportOptions: atom.config.get('atom-elearnjs.generalConfig.displayExportOptions'),
        }
    }

    /**
    * Will return an object with obj.content being the full HTML content
    * (as dom element) and all specific inputs.
    */
    getHTMLExportOptionsContent(defaults) {
        const self = this;

        var content = document.createElement('div');

        // Assets export
        content.appendChild(OptionMenuManager.getHeading('Asset exports'));
        var exportElearnjs = OptionMenuManager.getCheckBoxLabel(
            "Export elearn.js assets", defaults.exportElearnjs);
        content.appendChild(exportElearnjs);
        var exportLinkedFiles = OptionMenuManager.getCheckBoxLabel(
            "Export linked files into asset folder (only <img>, <source>, <script>, <link>)",
            defaults.exportLinkedFiles);
        content.appendChild(exportLinkedFiles);

        // Extension Options
        content.appendChild(OptionMenuManager.getHeading('Extensions'));
        content.appendChild(OptionMenuManager.getDescription(
            `Values defined by Method <em>'${
                self.getExtensionDetectionMethodName(
                    atom.config.get('atom-elearnjs.generalConfig.detectExtensionsMethod'))
            }'</em>. Check settings to change method.`, true));
        var includeQuiz = OptionMenuManager.getCheckBoxLabel(
            "Include quiz.js", defaults.includeQuiz);
        content.appendChild(includeQuiz);
        var includeElearnVideo = OptionMenuManager.getCheckBoxLabel(
            "Include elearnvideo.js", defaults.includeElearnVideo);
        content.appendChild(includeElearnVideo);
        var includeClickImage = OptionMenuManager.getCheckBoxLabel(
            "Include clickimage.js", defaults.includeClickImage);
        content.appendChild(includeClickImage);
        var includeTimeSlider = OptionMenuManager.getCheckBoxLabel(
            "Include timeslider.js", defaults.includeTimeSlider);
        content.appendChild(includeTimeSlider);

        // General
        content.appendChild(OptionMenuManager.getHeading('General'));
        var displayExportOptions = OptionMenuManager.getCheckBoxLabel(
            "Always display export options", defaults.displayExportOptions);
        content.appendChild(displayExportOptions);

        // return necessary elements
        return {
            content: content,
            exportElearnjs: exportElearnjs.checkbox,
            exportLinkedFiles: exportLinkedFiles.checkbox,
            includeQuiz: includeQuiz.checkbox,
            includeElearnVideo: includeElearnVideo.checkbox,
            includeClickImage: includeClickImage.checkbox,
            includeTimeSlider: includeTimeSlider.checkbox,
            displayExportOptions: displayExportOptions.checkbox,
        };
    }

    /**
    * Will parse the selected values in all defined inputs from
    * `getHTMLExportOptionsContent` contentObj.
    *
    * @param contentObj the return value of `getHTMLExportOptionsContent`
    */
    parseHTMLExportOptions(contentObj) {
        return {
            exportAssets: contentObj.exportElearnjs.checked,
            exportLinkedFiles: contentObj.exportLinkedFiles.checked,
            includeQuiz: contentObj.includeQuiz.checked,
            includeElearnVideo: contentObj.includeElearnVideo.checked,
            includeClickImage: contentObj.includeClickImage.checked,
            includeTimeSlider: contentObj.includeTimeSlider.checked,
            displayExportOptions: contentObj.displayExportOptions.checked,
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
        };
    }

    /**
    * Deserializes a given object and restoring previously set variables.
    * @param state a state generated by `FileWriter::serialize()`
    */
    deserialize(state) {
        if(atom.config.get('atom-elearnjs.generalConfig.keepExportSettings')) {
            if(state.lastHTMLExportOptions) this.lastHTMLExportOptions = state.lastHTMLExportOptions;
        }
    }
}

module.exports = ExportOptionManager;
