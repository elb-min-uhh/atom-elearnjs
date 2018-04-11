"use strict";

const Showdown = require('showdown');

// regular expressions
// original markdown
var inlineHeadingRegExp = /^(#{1,6})(?!#)(?!<!--no-section-->)[ \t]*(.+?)[ \t]*#*$/gm;

// elearn.js syntax extensions
var sectionRegExp = /(\|{3,5})(?!\|)((?:\\\||(?!\1).)*?)\1(.*)\n/g;
var firstSectionRegExp = new RegExp(sectionRegExp, "");
var imprintRegExp = /(?:(?:^|\n)(```+|~~~+)imprint\s*?\n([\s\S]*?)\n\1|(?:^|\n)(<!--+)imprint\s*?\n([\s\S]*?)\n--+>)/;
var metaBlockRegExp = /(?:(?:^|\n)(---+)\n([\s\S]*?)\n\1|(?:^|\n)(<!--+)meta\n([\s\S]*?)\n--+>)/;
var metaBlockElementsRegExp = /(?:(?:^|\n)(\w+)\s*:\s*(["'`])((?:\\\2|(?!\2)[\s\S])*?)\2|(?:^|\n)(\w+)\s*:\s*([^\n]*))/g;

// elearn.js additional comments
var hideInOverviewRegExp = /\s*<!--hide-in-overview-->/g;
var noSectionRegExp = /\s*<!--no-section-->/g;

var escapeSectionName = (name) => {
    // there should be no single \, since they have to be escaped in markdown
    return name.replace(/\|/g, "\\|");
};
var unescapeSectionName = (name) => {
    // unescape \\ needs to be done everywhere when interpreting markdown code
    return name.replace(/\\\|/g, "|").replace(/\\\\/g, "\\");
};
var escapeHTMLQuotes = (text) => {
    return text.replace(/"/g, "&quot;");
};
var removeMarkdownSyntax = (text, converter) => {
    return converter.makeHtml(text).replace(/<.*?>/g, "");
};


const addSectionOnHeading = {
    type: 'lang',
    filter: (text, converter) => {
        const headingDepth = atom.config.get('atom-elearnjs.generalConfig.newSectionOnHeadingDepth');

        const useSubSections = atom.config.get('atom-elearnjs.htmlConfig.sectionOrder.useSectionLevel');
        const subSection = atom.config.get('atom-elearnjs.htmlConfig.sectionOrder.sub');
        const subSubSection = atom.config.get('atom-elearnjs.htmlConfig.sectionOrder.subsub');

        // parse headings
        if(atom.config.get('atom-elearnjs.generalConfig.newSectionOnHeading')) {
            var match = text.match(inlineHeadingRegExp);
            if(match && match.length) {
                text = text.replace(inlineHeadingRegExp, (wholeMatch, type, content) => {
                    content = content.trim();
                    var ret = `${type}<!--no-section-->${content}`;
                    if(type.length <= headingDepth
                            && content.indexOf(`<!--no-section-->`) < 0) {

                        var hideInOverview = content.indexOf(`<!--hide-in-overview-->`) >= 0 ? '<!--hide-in-overview-->' : '';
                        content = content.replace(hideInOverviewRegExp, "");

                        // default section
                        if(!useSubSections
                                || type.length < subSection) {
                            ret = `|||${escapeSectionName(content)}|||${hideInOverview}\n` + ret;
                        }
                        else if(type.length < subSubSection) {
                            ret = `||||${escapeSectionName(content)}||||${hideInOverview}\n` + ret;
                        }
                        else {
                            ret = `|||||${escapeSectionName(content)}|||||${hideInOverview}\n` + ret;
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
        var parseSection = (wholeMatch, wrap, heading, addition) => {
            var size = wrap.length;
            heading = unescapeSectionName(heading);
            // make html to eval markdown syntax, remove created HTML elements then
            // assume < > as escaped chars &lt; and &gt; when not marking an html element
            heading = removeMarkdownSyntax(heading, converter);
            heading = escapeHTMLQuotes(heading);

            // check for sub or subsubsection
            var sub = '';
            for(var i=3; i<size; i++) sub += 'sub';

            // check for hide in overview
            var hide = '';
            if(addition.indexOf(`<!--hide-in-overview-->`) >= 0) hide = "hide-in-overview"

            var clazz = sub || hide ? ` class="${sub}${sub && hide ? ' ' : ''}${hide}"` : '';

            return `<section markdown="1" name="${heading}"${clazz}>\n`;
        };

        var match = text.match(firstSectionRegExp);
        if(match && match.length) {
            // replace only first
            text = text.replace(firstSectionRegExp, parseSection);
            // replace all following
            text = text.replace(sectionRegExp, (wholeMatch, wrap, heading, addition) => {
                return `</section>${parseSection(wholeMatch, wrap, heading, addition)}`;
            });
            text += "</section>";
        }

        return text;
    }
};

const pdfSectionSyntax = {
    type: 'lang',
    filter: (text, converter) => {
        var replacement = atom.config.get('atom-elearnjs.pdfConfig.newPageOnSection') ? '<div style="page-break-before: always;">' : '';

        var parseSection = (wholeMatch, wrap, heading, addition) => {
            var size = wrap.length;
            heading = unescapeSectionName(heading);
            // make html to eval markdown syntax, remove created HTML elements then
            // assume < > as escaped chars &lt; and &gt; when not marking an html element
            heading = removeMarkdownSyntax(heading, converter);
            heading = escapeHTMLQuotes(heading);

            // check for sub or subsubsection
            var sub = '';
            for(var i=3; i<size; i++) sub += 'sub';

            // check for hide in overview
            var hide = '';
            if(addition.indexOf(`<!--hide-in-overview-->`) >= 0) hide = "hide-in-overview"

            var clazz = sub || hide ? ` class="${sub}${sub && hide ? ' ' : ''}${hide}"` : '';

            return `<section markdown="1" name="${heading}"${clazz}>\n`;
        };

        var match = text.match(firstSectionRegExp);
        if(match && match.length) {
            // replace only first
            text = text.replace(firstSectionRegExp, parseSection);
            // replace all following
            text = text.replace(sectionRegExp, (wholeMatch, wrap, heading, addition) => {
                return `</section>${replacement}${parseSection(wholeMatch, wrap, heading, addition)}`;
            });
            text += "</section>";
        }

        return text;
    }
};

const removeMetaBlock = {
    type: 'lang',
    filter: (text, converter) => {
        var match = text.match(metaBlockRegExp);
        if(match && match.length) {
             text = text.replace(/\r/g, "").replace(metaBlockRegExp, function () {
                 return "";
             });
        }
        return text;
    }
};

const parseImprint = {
    type: 'lang',
    filter: (text, converter) => {
        text = text.replace(/\r/g, "");
        var imprint = text;
        text.replace(imprintRegExp, function (wholeMatch, delim1, codeblock1, delim2, codeblock2) {
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
        text = text.replace(/\r/g, "").replace(imprintRegExp, function (wholeMatch, delim, content) {
            return "";
        });
        return text;
    }
};

const cleanNoSectionComment = {
    type: 'listener',
    listeners: {
        'headers.before': (event, text, options, globals) => {
            text = text.replace(noSectionRegExp, "");
            return text;
        }
    }
};

const cleanHideInOverviewComment = {
    type: 'listener',
    listeners: {
        'headers.before': (event, text, options, globals) => {
            text = text.replace(hideInOverviewRegExp, "");
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
    return [addSectionOnHeading, cleanNoSectionComment, cleanHideInOverviewComment, replaceSectionSyntax, removeMetaBlock, removeImprintBlock, cleanEmptyParagraphs];
}

var elearnPdfBody = () => {
    return [addSectionOnHeading, cleanNoSectionComment, cleanHideInOverviewComment, pdfSectionSyntax, removeMetaBlock, removeImprintBlock, cleanEmptyParagraphs];
}

var elearnImprint = () => {
    return [parseImprint];
}

var parseMetaData = (text) => {
    var meta = "";
    text = text.replace(/\r/g, "");
    text.replace(metaBlockRegExp, function (wholeMatch, delim1, content1, delim2, content2) {
        var content = delim1 ? content1 : (delim2 ? content2 : "");
        // 2 options: Key: ["'`]MULTILINE_VALUE["'`] or Key: VALUE
        meta = content.replace(metaBlockElementsRegExp, function(wholeMatch, tag1, valueSurrounding, value1, tag2, value2) {
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
        return `<meta name="${tag.toLowerCase()}" content="${escapeHTMLQuotes(value)}"/>`
    }
}

module.exports.elearnHtmlBody = elearnHtmlBody;
module.exports.elearnPdfBody = elearnPdfBody;
module.exports.elearnImprint = elearnImprint;
module.exports.parseMetaData = parseMetaData;
