"use strict";

const path = require('path');
const fs = require('fs');
var ncp = require('ncp').ncp;

// Capturing groups: 1, 2 for attributes before src, 3: wrapping char ["'], 4: src value
var imageSrcRegExp = /<(img)[ \t]((?:(?!src[ \t]*=[ \t]*["'])\S+[ \t]*=[ \t]*(["'])(?:\\\3|(?!\3).)*\3[ \t]*)*)src[ \t]*=[ \t]*(["'])((?:\\\4|(?!\4).)*)\4((?:(?!\/?>).|[^\/>])*)(\/?)>/gi;
var scriptSrcRegExp = /<(script)[ \t]((?:(?!src[ \t]*=[ \t]*["'])\S+[ \t]*=[ \t]*(["'])(?:\\\3|(?!\3).)*\3[ \t]*)*)src[ \t]*=[ \t]*(["'])((?:\\\4|(?!\4).)*)\4((?:(?!\/?>).|[^\/>])*)(\/?)>/gi;
var linkHrefRegExp = /<(link)[ \t]((?:(?!href[ \t]*=[ \t]*["'])\S+[ \t]*=[ \t]*(["'])(?:\\\3|(?!\3).)*\3[ \t]*)*)href[ \t]*=[ \t]*(["'])((?:\\\4|(?!\4).)*)\4((?:(?!\/?>).|[^\/>])*)(\/?)>/gi;
var videoSourceSrcRegExp = /<(source)[ \t]((?:(?!src[ \t]*=[ \t]*["'])\S+[ \t]*=[ \t]*(["'])(?:\\\3|(?!\3).)*\3[ \t]*)*)src[ \t]*=[ \t]*(["'])((?:\\\4|(?!\4).)*)\4((?:(?!\/?>).|[^\/>])*)(\/?)>/gi;

var notHttpRegExp = /^(?!https?).*/g;
var isRelativePath = /\.[\/]/;

var processSourceReplacement = function(inputRoot, outputRoot, wholeMatch, tag, before, wrapBefore, wrap, val, after, closingSlash) {
    var ret = wholeMatch;

    // update and extract if local file
    if(val.match(notHttpRegExp)) {
        var fileName = path.basename(val);

        var inputPath = path.resolve(`${inputRoot}/${val}`).replace(/\\/g, "/");

        // replace val
        switch(tag.toLowerCase()) {
            case "img":
            case "source": val = `assets/img/${fileName}`; break;
            case "script": val = `assets/js/${fileName}`; break;
            case "link": val = `assets/css/${fileName}`; break;
        }

        var outputPath = path.resolve(`${outputRoot}/${val}`).replace(/\\/g, "/");

        copyFile(inputPath, outputPath, true, (err) => {
            if(err) throw err;
        });

        switch(tag.toLowerCase()) {
            case "img":
            case "source":
            case "script": ret = `<${tag} ${before?before:""}src=${wrap}${val}${wrap}${after?after:""}${closingSlash?closingSlash:""}>`; break;
            case "link": ret = `<${tag} ${before?before:""}href=${wrap}${val}${wrap}${after?after:""}${closingSlash?closingSlash:""}>`; break;
        }
    }

    return ret;
};

/**
* Copy a file, creates nonexistent directories
*/
function copyFile(source, target, ignoreNotExistent, cb) {
    // do not overwrite with itself [will create a 0B file]
    if(path.resolve(source) === path.resolve(target)) {
        done();
        return;
    }

    // nonexistent source
    if(!fs.existsSync(source)) {
        if(!ignoreNotExistent) cb(`File does not exist ${source}`);
        return;
    }

    var ensureDirectoryExistence = function (filePath) {
        var dirname = path.dirname(filePath);
        if (fs.existsSync(dirname)) {
            return true;
        }
        ensureDirectoryExistence(dirname);
        fs.mkdirSync(dirname);
    }
    ensureDirectoryExistence(target);

    var cbCalled = false;
    var rd = fs.createReadStream(source);
    rd.on("error", function (err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function (err) {
        done(err);
    });
    wr.on("close", function (ex) {
        done();
    });
    rd.pipe(wr);
    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
};

class FileExtractor {
    static extractAll(html, inputRoot, outputRoot) {
        html = FileExtractor.extractImages(html, inputRoot, outputRoot);
        html = FileExtractor.extractScripts(html, inputRoot, outputRoot);
        html = FileExtractor.extractStyleSheets(html, inputRoot, outputRoot);
        html = FileExtractor.extractVideoSource(html, inputRoot, outputRoot);
        return html;
    }

    static extractImages(html, inputRoot, outputRoot) {
        html = html.replace(imageSrcRegExp, (wholeMatch, tag, before, wrapBefore, wrap, val, after, closingSlash) => {
            return processSourceReplacement(inputRoot, outputRoot, wholeMatch, tag, before, wrapBefore, wrap, val, after, closingSlash);
        });
        return html;
    }

    static extractScripts(html, inputRoot, outputRoot) {
        html = html.replace(scriptSrcRegExp, (wholeMatch, tag, before, wrapBefore, wrap, val, after, closingSlash) => {
            return processSourceReplacement(inputRoot, outputRoot, wholeMatch, tag, before, wrapBefore, wrap, val, after, closingSlash);
        });
        return html;
    }

    static extractStyleSheets(html, inputRoot, outputRoot) {
        html = html.replace(linkHrefRegExp, (wholeMatch, tag, before, wrapBefore, wrap, val, after, closingSlash) => {
            return processSourceReplacement(inputRoot, outputRoot, wholeMatch, tag, before, wrapBefore, wrap, val, after, closingSlash);
        });
        return html;
    }

    static extractVideoSource(html, inputRoot, outputRoot) {
        html = html.replace(videoSourceSrcRegExp, (wholeMatch, tag, before, wrapBefore, wrap, val, after, closingSlash) => {
            return processSourceReplacement(inputRoot, outputRoot, wholeMatch, tag, before, wrapBefore, wrap, val, after, closingSlash);
        });
        return html;
    }
}

module.exports = FileExtractor;
