"use babel";
"use strict";

import OptionMenuManager from './OptionMenuManager';

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
    */
    async openHTMLExportOptions(defaults, forcePrompt) {
        const self = this;

        if(!forcePrompt && self.lastHTMLExportOptions) {
            return { values: self.lastHTMLExportOptions, returnValue: 1 };
        }

        // file selected
        // continue with export options
        let contentObj = self.getHTMLExportOptionsContent(defaults);

        // open export options
        let val = await self.optionMenuManager.open({
            content: contentObj.content,
            header: "HTML Export Options",
            buttons: ["Cancel", "Export"],
        });
        let exportOptions = self.parseHTMLExportOptions(contentObj);
        if(val) {
            self.lastHTMLExportOptions = exportOptions;
            if(exportOptions.displayExportOptions !==
                atom.config.get('atom-elearnjs.generalConfig.displayExportOptions')) {
                atom.config.set('atom-elearnjs.generalConfig.displayExportOptions',
                    exportOptions.displayExportOptions);
            }
        }
        return ({ values: exportOptions, returnValue: val });
    }

    /**
    * Will return an object containing all default values for the
    * options displayed.
    */
    getHTMLExportOptionDefaults(extensionObject) {
        const self = this;

        let language = (self.lastHTMLExportOptions &&
            self.lastHTMLExportOptions.language !== undefined) ?
            self.lastHTMLExportOptions.language : "de";

        let removeComments = (self.lastHTMLExportOptions &&
            self.lastHTMLExportOptions.removeComments !== undefined) ?
            self.lastHTMLExportOptions.removeComments : false;

        let exportAssets = (self.lastHTMLExportOptions &&
            self.lastHTMLExportOptions.exportAssets !== undefined) ?
            self.lastHTMLExportOptions.exportAssets : true;

        let exportLinkedFiles = (self.lastHTMLExportOptions &&
            self.lastHTMLExportOptions.exportLinkedFiles !== undefined) ?
            self.lastHTMLExportOptions.exportLinkedFiles : true;

        // Extension Defaults
        let detectionMethod = atom.config.get('atom-elearnjs.generalConfig.detectExtensionsMethod');
        let includeQuiz, includeElearnVideo, includeClickImage, includeTimeSlider;
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
            includeQuiz = extensionObject.includeQuiz;
            includeElearnVideo = extensionObject.includeElearnVideo;
            includeClickImage = extensionObject.includeClickImage;
            includeTimeSlider = extensionObject.includeTimeSlider;
        }

        // return
        return {
            language: language,
            removeComments: removeComments,
            exportAssets: exportAssets,
            exportLinkedFiles: exportLinkedFiles,
            includeQuiz: includeQuiz,
            includeElearnVideo: includeElearnVideo,
            includeClickImage: includeClickImage,
            includeTimeSlider: includeTimeSlider,
            displayExportOptions: atom.config.get('atom-elearnjs.generalConfig.displayExportOptions'),
        };
    }

    /**
    * Will return an object with obj.content being the full HTML content
    * (as dom element) and all specific inputs.
    */
    getHTMLExportOptionsContent(defaults) {
        const self = this;

        let content = document.createElement('div');

        // Language
        content.appendChild(OptionMenuManager.getHeading('Language'));
        let language = OptionMenuManager.getSelectLabel("",
            [
                { "text": "German", value: "de" },
                { "text": "English", value: "en" }
            ],
            defaults.language);
        content.appendChild(language);

        // Conversion
        content.appendChild(OptionMenuManager.getHeading('Conversion'));
        let removeComments = OptionMenuManager.getCheckBoxLabel(
            "Remove Html Comments", defaults.removeComments);
        content.appendChild(removeComments);

        // Assets export
        content.appendChild(OptionMenuManager.getHeading('Asset exports'));
        let exportAssets = OptionMenuManager.getCheckBoxLabel(
            "Export elearn.js assets", defaults.exportAssets);
        content.appendChild(exportAssets);
        let exportLinkedFiles = OptionMenuManager.getCheckBoxLabel(
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
        let includeQuiz = OptionMenuManager.getCheckBoxLabel(
            "Include quiz.js", defaults.includeQuiz);
        content.appendChild(includeQuiz);
        let includeElearnVideo = OptionMenuManager.getCheckBoxLabel(
            "Include elearnvideo.js", defaults.includeElearnVideo);
        content.appendChild(includeElearnVideo);
        let includeClickImage = OptionMenuManager.getCheckBoxLabel(
            "Include clickimage.js", defaults.includeClickImage);
        content.appendChild(includeClickImage);
        let includeTimeSlider = OptionMenuManager.getCheckBoxLabel(
            "Include timeslider.js", defaults.includeTimeSlider);
        content.appendChild(includeTimeSlider);

        // General
        content.appendChild(OptionMenuManager.getHeading('General'));
        let displayExportOptions = OptionMenuManager.getCheckBoxLabel(
            "Always display export options", defaults.displayExportOptions);
        content.appendChild(displayExportOptions);

        // return necessary elements
        return {
            content: content,
            language: language.select,
            removeComments: removeComments.checkbox,
            exportAssets: exportAssets.checkbox,
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
            language: contentObj.language.value,
            exportAssets: contentObj.exportAssets.checked,
            removeComments: contentObj.removeComments.checked,
            exportLinkedFiles: contentObj.exportLinkedFiles.checked,
            includeQuiz: contentObj.includeQuiz.checked,
            includeElearnVideo: contentObj.includeElearnVideo.checked,
            includeClickImage: contentObj.includeClickImage.checked,
            includeTimeSlider: contentObj.includeTimeSlider.checked,
            displayExportOptions: contentObj.displayExportOptions.checked,
        };
    }

    /**
    * Will open the Export Options
    * @param defaults object: Contains all default values to be displayed.
    *                 `getPDFExportOptionDefaults` will return this object.
    * @param forcePrompt bool: if true it will always prompt, even when there
    *                    are cached options available
    */
    async openPDFExportOptions(defaults, forcePrompt) {
        const self = this;

        if(!forcePrompt && self.lastPDFExportOptions) {
            return { values: self.lastPDFExportOptions, returnValue: 1 };
        }

        // file selected
        // continue with export options
        let contentObj = self.getPDFExportOptionsContent(defaults);

        // open export options
        let val = await self.optionMenuManager.open({
            content: contentObj.content,
            header: "PDF Export Options",
            buttons: ["Cancel", "Export"],
        });
        let exportOptions = self.parsePDFExportOptions(contentObj);
        if(val) {
            self.lastPDFExportOptions = exportOptions;
            if(exportOptions.displayExportOptions !==
                atom.config.get('atom-elearnjs.generalConfig.displayExportOptions')) {
                atom.config.set('atom-elearnjs.generalConfig.displayExportOptions',
                    exportOptions.displayExportOptions);
            }
        }
        return { values: exportOptions, returnValue: val };
    }

    /**
    * Will return an object containing all default values for the
    * options displayed.
    */
    getPDFExportOptionDefaults(extensionObject) {
        const self = this;

        let language = (self.lastPDFExportOptions &&
            self.lastPDFExportOptions.language !== undefined) ?
            self.lastPDFExportOptions.language : "de";

        let removeComments = (self.lastPDFExportOptions &&
            self.lastPDFExportOptions.removeComments !== undefined) ?
            self.lastPDFExportOptions.removeComments : false;

        // Extension Defaults
        let detectionMethod = atom.config.get('atom-elearnjs.generalConfig.detectExtensionsMethod');
        let includeQuiz, includeElearnVideo, includeClickImage, includeTimeSlider;
        if(detectionMethod === "on") {
            includeQuiz = includeElearnVideo = includeClickImage = includeTimeSlider = true;
        }
        else if(detectionMethod === "off") {
            includeQuiz = includeElearnVideo = includeClickImage = includeTimeSlider = false;
        }
        else if(detectionMethod === "last" && self.lastPDFExportOptions) {
            if(self.lastPDFExportOptions.includeQuiz)
                includeQuiz = self.lastPDFExportOptions.includeQuiz;
            if(self.lastPDFExportOptions.includeElearnVideo)
                includeElearnVideo = self.lastPDFExportOptions.includeElearnVideo;
            if(self.lastPDFExportOptions.includeClickImage)
                includeClickImage = self.lastPDFExportOptions.includeClickImage;
            if(self.lastPDFExportOptions.includeTimeSlider)
                includeTimeSlider = self.lastPDFExportOptions.includeTimeSlider;
        }
        else if(detectionMethod === "auto") {
            includeQuiz = extensionObject.includeQuiz;
            includeElearnVideo = extensionObject.includeElearnVideo;
            includeClickImage = extensionObject.includeClickImage;
            includeTimeSlider = extensionObject.includeTimeSlider;
        }

        // return
        return {
            language: language,
            removeComments: removeComments,
            includeQuiz: includeQuiz,
            includeElearnVideo: includeElearnVideo,
            includeClickImage: includeClickImage,
            includeTimeSlider: includeTimeSlider,
            displayExportOptions: atom.config.get('atom-elearnjs.generalConfig.displayExportOptions'),
        };
    }

    /**
    * Will return an object with obj.content being the full HTML content
    * (as dom element) and all specific inputs.
    */
    getPDFExportOptionsContent(defaults) {
        const self = this;

        let content = document.createElement('div');

        // Language
        content.appendChild(OptionMenuManager.getHeading('Language'));
        let language = OptionMenuManager.getSelectLabel("",
            [
                { "text": "German", value: "de" },
                { "text": "English", value: "en" }
            ],
            defaults.language);
        content.appendChild(language);

        // Conversion
        content.appendChild(OptionMenuManager.getHeading('Conversion'));
        let removeComments = OptionMenuManager.getCheckBoxLabel(
            "Remove Html Comments", defaults.removeComments);
        content.appendChild(removeComments);

        // Extension Options
        content.appendChild(OptionMenuManager.getHeading('Extensions'));
        content.appendChild(OptionMenuManager.getDescription(
            `Values defined by Method <em>'${
            self.getExtensionDetectionMethodName(
                atom.config.get('atom-elearnjs.generalConfig.detectExtensionsMethod'))
            }'</em>. Check settings to change method.`, true));
        let includeQuiz = OptionMenuManager.getCheckBoxLabel(
            "Include quiz.js", defaults.includeQuiz);
        content.appendChild(includeQuiz);
        let includeElearnVideo = OptionMenuManager.getCheckBoxLabel(
            "Include elearnvideo.js", defaults.includeElearnVideo);
        content.appendChild(includeElearnVideo);
        let includeClickImage = OptionMenuManager.getCheckBoxLabel(
            "Include clickimage.js", defaults.includeClickImage);
        content.appendChild(includeClickImage);
        let includeTimeSlider = OptionMenuManager.getCheckBoxLabel(
            "Include timeslider.js", defaults.includeTimeSlider);
        content.appendChild(includeTimeSlider);

        // General
        content.appendChild(OptionMenuManager.getHeading('General'));
        let displayExportOptions = OptionMenuManager.getCheckBoxLabel(
            "Always display export options", defaults.displayExportOptions);
        content.appendChild(displayExportOptions);

        // return necessary elements
        return {
            content: content,
            language: language.select,
            removeComments: removeComments.checkbox,
            includeQuiz: includeQuiz.checkbox,
            includeElearnVideo: includeElearnVideo.checkbox,
            includeClickImage: includeClickImage.checkbox,
            includeTimeSlider: includeTimeSlider.checkbox,
            displayExportOptions: displayExportOptions.checkbox,
        };
    }

    /**
    * Will parse the selected values in all defined inputs from
    * `getPDFExportOptionsContent` contentObj.
    *
    * @param contentObj the return value of `getPDFExportOptionsContent`
    */
    parsePDFExportOptions(contentObj) {
        return {
            language: contentObj.language.value,
            removeComments: contentObj.removeComments.checked,
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
