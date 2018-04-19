"use strict";

const path = require('path');

const divClassRegExp = /<div[ \t]((?:(?!class[ \t]*=[ \t]*["'])\S+[ \t]*=[ \t]*(["'])(?:\\\2|(?!\2).)*\2[ \t]*)*)class[ \t]*=[ \t]*(["'])((?:\\\3|(?!\3).)*)\3((?:(?!\/?>).|[^\/>])*)(\/?)>/gi;
const videoRegExp = /<video[ \t>]/g;

class ExtensionManager {

    // Scan
    static scanForQuiz(html) {
        var include = false;
        html.replace(divClassRegExp, (wholeMatch, before, wrapBefore, wrap, classVal, after, closingSlash) => {
            if(classVal.match(/(?:^|\s)question(?:$|\s)/g)) include = true;
            return false;
        });
        return include;
    }

    static scanForVideo(html) {
        var include = false;
        if(html.match(videoRegExp)) include = true;
        return include;
    }

    static scanForClickImage(html) {
        var include = false;
        html.replace(divClassRegExp, (wholeMatch, before, wrapBefore, wrap, classVal, after, closingSlash) => {
            if(classVal.match(/(?:^|\s)clickimage(?:$|\s)/g)) include = true;
            return false;
        });
        return include;
    }

    static scanForTimeSlider(html) {
        var include = false;
        html.replace(divClassRegExp, (wholeMatch, before, wrapBefore, wrap, classVal, after, closingSlash) => {
            if(classVal.match(/(?:^|\s)timeslider(?:$|\s)/g)) include = true;
            return false;
        });
        return include;
    }

    // Locations to copy from

    static getQuizAssetDir() {
        return path.resolve(__dirname + '/../assets/elearnjs/extensions/quiz/assets/');
    }

    static getElearnVideoAssetDir() {
        return path.resolve(__dirname + '/../assets/elearnjs/extensions/elearnvideo/assets/');
    }

    static getClickImageAssetDir() {
        return path.resolve(__dirname + '/../assets/elearnjs/extensions/clickimage/assets/');
    }

    static getTimeSliderAssetDir() {
        return path.resolve(__dirname + '/../assets/elearnjs/extensions/timeslider/assets/');
    }

    // Asset Strings for a HTML Export

    static getHTMLAssetStrings(includeQuiz, includeElearnVideo, includeClickImage, includeTimeSlider) {
        return `${includeQuiz ? ExtensionManager.getQuizHTMLAssetString() : ""}
                ${includeElearnVideo ? ExtensionManager.getElearnVideoHTMLAssetString() : ""}
                ${includeClickImage ? ExtensionManager.getClickImageHTMLAssetString() : ""}
                ${includeTimeSlider ? ExtensionManager.getTimeSliderHTMLAssetString() : ""}`;
    }

    static getHTMLAssetString(name) {
        return `<link rel="stylesheet" type="text/css" href="assets/css/${name}.css">
                <script type="text/javascript" src="assets/js/${name}.js"></script>`;
    }

    static getQuizHTMLAssetString() {
        return ExtensionManager.getHTMLAssetString("quiz");
    }

    static getElearnVideoHTMLAssetString() {
        return ExtensionManager.getHTMLAssetString("elearnvideo");
    }

    static getClickImageHTMLAssetString() {
        return ExtensionManager.getHTMLAssetString("clickimage");
    }

    static getTimeSliderHTMLAssetString() {
        return `<link rel="stylesheet" type="text/css" href="assets/css/timeslider.css">
                <script type="text/javascript" src="assets/js/moment.js"></script>
                <script type="text/javascript" src="assets/js/timeslider.js"></script>`;
    }

    // Asset Strings for a PDF Export

    static getPDFAssetStrings(includeQuiz, includeElearnVideo, includeClickImage, includeTimeSlider) {
        return `${includeQuiz ? ExtensionManager.getQuizPDFAssetString() : ""}
                ${includeElearnVideo ? ExtensionManager.getElearnVideoPDFAssetString() : ""}
                ${includeClickImage ? ExtensionManager.getClickImagePDFAssetString() : ""}
                ${includeTimeSlider ? ExtensionManager.getTimeSliderPDFAssetString() : ""}`;
    }

    static getQuizPDFAssetString() {
        return `<link rel="stylesheet" type="text/css"
                    href="file:///${path.resolve(__dirname + '/../assets/elearnjs/extensions/quiz/assets/css/quiz.css').replace(/\\/g, "/")}" />
                <link rel="stylesheet" type="text/css"
                    href="file:///${path.resolve(__dirname + '/../assets/elearnjs/pdfAssets/css/quiz.css').replace(/\\/g, "/")}" />
                <script type="text/javascript"
                    src="file:///${path.resolve(__dirname + '/../assets/elearnjs/extensions/quiz/assets/js/quiz.js').replace(/\\/g, "/")}"></script>`;
    }

    static getElearnVideoPDFAssetString() {
        return `<link rel="stylesheet" type="text/css"
                    href="file:///${path.resolve(__dirname + '/../assets/elearnjs/extensions/elearnvideo/assets/css/elearnvideo.css').replace(/\\/g, "/")}" />
                <link rel="stylesheet" type="text/css"
                    href="file:///${path.resolve(__dirname + '/../assets/elearnjs/pdfAssets/css/elearnvideo.css').replace(/\\/g, "/")}" />
                <script type="text/javascript"
                    src="file:///${path.resolve(__dirname + '/../assets/elearnjs/extensions/elearnvideo/assets/js/elearnvideo.js').replace(/\\/g, "/")}"></script>`;
    }

    static getClickImagePDFAssetString() {
        return `<link rel="stylesheet" type="text/css"
                    href="file:///${path.resolve(__dirname + '/../assets/elearnjs/extensions/clickimage/assets/css/clickimage.css').replace(/\\/g, "/")}" />
                <link rel="stylesheet" type="text/css"
                    href="file:///${path.resolve(__dirname + '/../assets/elearnjs/pdfAssets/css/clickimage.css').replace(/\\/g, "/")}" />
                <script type="text/javascript"
                    src="file:///${path.resolve(__dirname + '/../assets/elearnjs/extensions/clickimage/assets/js/clickimage.js').replace(/\\/g, "/")}"></script>`;
    }

    static getTimeSliderPDFAssetString() {
        return `<link rel="stylesheet" type="text/css"
                    href="file:///${path.resolve(__dirname + '/../assets/elearnjs/extensions/timeslider/assets/css/timeslider.css').replace(/\\/g, "/")}" />
                <script type="text/javascript"
                    src="file:///${path.resolve(__dirname + '/../assets/elearnjs/extensions/timeslider/assets/js/moment.js').replace(/\\/g, "/")}"></script>
                <script type="text/javascript"
                    src="file:///${path.resolve(__dirname + '/../assets/elearnjs/extensions/timeslider/assets/js/timeslider.js').replace(/\\/g, "/")}"></script>`;
    }
}

module.exports = ExtensionManager;
