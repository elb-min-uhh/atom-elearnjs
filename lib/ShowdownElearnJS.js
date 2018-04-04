"use strict";

const Showdown = require('showdown');

const addSectionOnHeading = {
    type: 'lang',
    filter: (text, converter) => {
        const headingDepth = atom.config.get('atom-elearnjs.generalConfig.newSectionOnHeadingDepth');

        const useSubSections = atom.config.get('atom-elearnjs.htmlConfig.sectionOrder.useSectionLevel');
        const subSection = atom.config.get('atom-elearnjs.htmlConfig.sectionOrder.sub');
        const subSubSection = atom.config.get('atom-elearnjs.htmlConfig.sectionOrder.subsub');

        // parse headings
        if(atom.config.get('atom-elearnjs.generalConfig.newSectionOnHeading')) {
            var match = text.match(/^(#{1,6})(?!#)(?!<!--no-section-->)[ \t]*(.+?)[ \t]*#*$/m);
            if(match && match.length) {
                text = text.replace(/^(#{1,6})(?!#)(?!<!--no-section-->)[ \t]*(.+?)[ \t]*#*$/gm, (wholeMatch, type, content) => {
                    content = content.trim();
                    var ret = `${type}<!--no-section-->${content}`;
                    if(type.length <= headingDepth
                            && content.indexOf(`<!--no-section-->`) < 0) {
                        // default section
                        if(!useSubSections
                                || type.length < subSection) {
                            ret = `|||${content}///\n` + ret;
                        }
                        else if(type.length < subSubSection) {
                            ret = `||||${content}////\n` + ret;
                        }
                        else {
                            ret = `|||||${content}/////\n` + ret;
                        }
                    }
                    return ret;
                });
            }
        }

        return text;
    }
};

const replaceSectionSyntax = {
    type: 'lang',
    filter: (text, converter) => {
        var match = text.match(/(\|{3,5})(?!\|)([^\/]*)(\/{3,5})/g);
        if(match && match.length) {
            // replace only first
            text = text.replace(/(\|{3,5})(?!\|)([^\/]*)(\/{3,5})/, (wholeMatch, before, heading, after) => {
                var size = Math.min(before.length, after.length);
                var clazz = '';
                if(size === 4) clazz = 'class="sub"';
                if(size === 5) clazz = 'class="subsub"';
                return `<section markdown="1" name="${heading}" ${clazz}>`
            });
            // replace all following
            text = text.replace(/(\|{3,5})(?!\|)([^\/]*)(\/{3,5})/g, (wholeMatch, before, heading, after) => {
                var size = Math.min(before.length, after.length);
                var clazz = '';
                if(size === 4) clazz = 'class="sub"';
                else if(size === 5) clazz = 'class="subsub"';
                return `</section><section markdown="1" name="${heading}" ${clazz}>`
            });
            text += "</section>";
        }

        return text;
    }
};

const removeSectionSyntax = {
    type: 'lang',
    filter: (text, converter) => {
        var replacement = atom.config.get('atom-elearnjs.pdfConfig.newPageOnSection') ? '<div style="page-break-before: always;">' : '';
        var match = text.match(/(\|{3,5})(?!\|)([^\/]*)(\/{3,5})/g);
        if(match && match.length) {
            // remove first
            text = text.replace(/(\|{3,5})(?!\|)([^\/]*)(\/{3,5})/, '');
            // replace all following
            text = text.replace(/(\|{3,5})(?!\|)([^\/]*)(\/{3,5})/g, replacement);
        }

        return text;
    }
};

const removeMetaBlock = {
    type: 'lang',
    filter: (text, converter) => {
        var match = text.match(/(?:(?:^|\n)(---+)\n([\s\S]*?)\n\1|(?:^|\n)(<!--+)meta\n([\s\S]*?)\n--+>)/g);
        if(match && match.length) {
             text = text.replace(/\r/g, "").replace(/(?:(?:^|\n)(---+)\n([\s\S]*?)\n\1|(?:^|\n)(<!--+)meta\n([\s\S]*?)\n--+>)/, function () {
                 return "";
             });
        }
        return text;
    }
};

const parseImprint = {
    type: 'lang',
    filter: (text, converter) => {
        var imprint = text.replace(/\r/g, "");
        text.replace(/\r/g, "").replace(/(?:(?:^|\n)(```+|~~~+)imprint\s*?\n([\s\S]*?)\n\1|(?:^|\n)(<!--+)imprint\s*?\n([\s\S]*?)\n--+>)/, function (wholeMatch, delim1, codeblock1, delim2, codeblock2) {
            if(delim1) imprint = converter.makeHtml(codeblock1);
            else if(delim2) imprint = converter.makeHtml(codeblock2);

            return null;
        });
        return imprint;
    }
};

const removeImprintBlock = {
    type: 'lang',
    filter: (text, converter) => {
        text = text.replace(/\r/g, "").replace(/(?:^|\n)(```+|~~~+)imprint\s*?\n([\s\S]*?)\n\1/, function (wholeMatch, delim, content) {
            return "";
        });
        text = text.replace(/\r/g, "").replace(/(?:^|\n)(<!--+)imprint\s*?\n([\s\S]*?)\n--+>/, function (wholeMatch, delim, content) {
            return "";
        });
        return text;
    }
};

const cleanNoSectionComment = {
    type: 'listener',
    listeners: {
        'headers.before': (event, text, options, globals) => {
            text = text.replace(/<!--no-section-->/g, "");
            return text;
        }
    }
};

const cleanEmptyParagraphs = {
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
};

var elearnHtmlBody = () => {
    return [addSectionOnHeading, cleanNoSectionComment, replaceSectionSyntax, removeMetaBlock, removeImprintBlock, cleanEmptyParagraphs];
}

var elearnPdfBody = () => {
    return [addSectionOnHeading, cleanNoSectionComment, removeSectionSyntax, removeMetaBlock, removeImprintBlock, cleanEmptyParagraphs];
}

var elearnImprint = () => {
    return [parseImprint];
}

var parseMetaData = (text) => {
    var meta = "";
    text = text.replace(/\r/g, "");
    text.replace(/(?:(?:^|\n)(---+)\n([\s\S]*?)\n\1|(?:^|\n)(<!--+)meta\n([\s\S]*?)\n--+>)/, function (wholeMatch, delim1, content1, delim2, content2) {
        var content = delim1 ? content1 : (delim2 ? content2 : "");
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

var createMeta = (tag, value, valueSurrounding) => {
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
