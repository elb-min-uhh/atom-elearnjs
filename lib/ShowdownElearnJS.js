"use strict";

const Showdown = require('showdown');

var elearnHtmlBody = () => {
    var sections = {
        type: 'lang',
        filter: (text, converter) => {
            var match = text.match(/\|{3}([^\/]*)\/{3}/g);
            if(match && match.length) {
                // replace only first
                text = text.replace(/\|{3}([^\/]*)\/{3}/, '<section markdown="1" name="$1">');
                // replace all following
                text = text.replace(/\|{3}([^\/]*)\/{3}/g, '</section><section markdown="1" name="$1">');
                text += "</section>";
            }

            return text;
        }
    }

    var metadata = {
        type: 'lang',
        filter: (text, converter) => {
            var match = text.match(/^\s*---/g);
            if(match && match.length) {
                 text = text.replace(/\r/g, "").replace(/(?:^|\n)(---+)\n([\s\S]*?)\n\1/, function (wholeMatch, delim, content) {
                     return "";
                 });
            }
            return text;
        }
    }

    var imprint = {
        type: 'lang',
        filter: (text, converter) => {
            text = text.replace(/\r/g, "").replace(/(?:^|\n)(```+|~~~+)imprint\s*?\n([\s\S]*?)\n\1/, function (wholeMatch, delim, content) {
                return "";
            });
            text = text.replace(/\r/g, "").replace(/(?:^|\n)(<!--+)imprint\s*?\n([\s\S]*?)\n-->/, function (wholeMatch, delim, content) {
                return "";
            });
            return text;
        }
    }

    var paragraphCleanUp = {
        type: 'output',
        filter: (text, converter) => {
            var cleanBefore = ['div', 'iframe'];
            text = text.replace(/<p><\/p>/g, "");

            for(var element of cleanBefore) {
                var regBefore = new RegExp(`<p><${element}`, "g");
                var regAfter = new RegExp(`</${element}></p>`, "g");
                text = text.replace(regBefore, `<${element}`)
                            .replace(regAfter, `</${element}>`);
            }

            return text;
        }
    }

    return [sections, metadata, imprint, paragraphCleanUp];
}

var elearnPdfBody = () => {
    var sections = {
        type: 'lang',
        filter: (text, converter) => {
            var match = text.match(/\|{3}([^\/]*)\/{3}/g);
            if(match && match.length) {
                // replace all following
                text = text.replace(/\|{3}([^\/]*)\/{3}/g, '');
            }

            return text;
        }
    }

    var metadata = {
        type: 'lang',
        filter: (text, converter) => {
            var match = text.match(/^\s*---/g);
            if(match && match.length) {
                 text = text.replace(/\r/g, "").replace(/(?:^|\n)(---+)\n([\s\S]*?)\n\1/, function (wholeMatch, delim, content) {
                     return "";
                 });
            }
            return text;
        }
    }

    var imprint = {
        type: 'lang',
        filter: (text, converter) => {
            text = text.replace(/\r/g, "").replace(/(?:^|\n)(```+|~~~+)imprint\s*?\n([\s\S]*?)\n\1/, function (wholeMatch, delim, content) {
                return "";
            });
            text = text.replace(/\r/g, "").replace(/(?:^|\n)(<!--+)imprint\s*?\n([\s\S]*?)\n-->/, function (wholeMatch, delim, content) {
                return "";
            });
            return text;
        }
    }

    var paragraphCleanUp = {
        type: 'output',
        filter: (text, converter) => {
            var cleanBefore = ['div', 'iframe'];
            text = text.replace(/<p><\/p>/g, "");

            for(var element of cleanBefore) {
                var regBefore = new RegExp(`<p><${element}`, "g");
                var regAfter = new RegExp(`</${element}></p>`, "g");
                text = text.replace(regBefore, `<${element}`)
                            .replace(regAfter, `</${element}>`);
            }

            return text;
        }
    }

    return [sections, metadata, imprint, paragraphCleanUp];
}

var elearnImprint = () => {
    var imprint = {
        type: 'lang',
        filter: (text, converter) => {
            var imprint = text.replace(/\r/g, "");
            text.replace(/\r/g, "").replace(/(?:(?:^|\n)(```+|~~~+)imprint\s*?\n([\s\S]*?)\n\1|(?:^|\n)(<!--+)imprint\s*?\n([\s\S]*?)\n-->)/, function (wholeMatch, delim1, codeblock1, delim2, codeblock2) {
                if(delim1) imprint = converter.makeHtml(codeblock1);
                else if(delim2) imprint = converter.makeHtml(codeblock2);

                return null;
            });
            return imprint;
        }
    }

    return [imprint];
}

var parseMetaData = (text) => {
    var meta = "";
    text = text.replace(/\r/g, "");
    text.replace(/(?:^|\n)(---+)\n([\s\S]*?)\n\1/, function (wholeMatch, delim, content) {
        // 2 options: Key: ["'`]MULTILINE_VALUE["'`] or Key: VALUE
        meta = content.replace(/(?:(?:^|\n)(\w+)\s*:\s*(["'`])((?:\\\2|(?!\2)[\s\S])*?)\2|(?:^|\n)(\w+)\s*:\s*([^\n]*))/g, function(wholeMatch, tag1, valueSurrounding, value1, tag2, value2) {
            // ignore escaped endings
            if(wholeMatch.match(/^(\w+)\s*:\s*(["'`])([\s\S]*?)\\\2$/)) return wholeMatch;

            if(tag1) return createMeta(tag1, value1, valueSurrounding);
            else if(tag2) return createMeta(tag2, value2, valueSurrounding);
        });
        return;
    });
    return meta;
}

function createMeta(tag, value, valueSurrounding) {
    // unescape
    if(valueSurrounding) {
        var regex = new RegExp("\\\\"+valueSurrounding, "g");
        value = value.replace(regex, valueSurrounding);
    }
    if(tag.toLowerCase() === "title") {
        return `<title>${value}</title>`;
    }
    if(tag.toLowerCase() === "custom") {
        // value unescaped
        return value;
    }
    else {
        return `<meta name="${tag.toLowerCase()}" content="${value.replace('"', '\\"')}"/>`
    }
}

module.exports.elearnHtmlBody = elearnHtmlBody;
module.exports.elearnPdfBody = elearnPdfBody;
module.exports.elearnImprint = elearnImprint;
module.exports.parseMetaData = parseMetaData;
