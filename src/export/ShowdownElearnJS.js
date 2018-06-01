"use strict";

const Showdown = require('showdown');

// regular expressions
var indentionRegExp = /(?:^|\n)([ \t]*)(?!(?:\n|$))/g;

// original markdown
var inlineHeadingRegExp = /^(#{1,6})(?!#)(?!<!--no-section-->)[ \t]*(.+?)[ \t]*#*$/gm;

// elearn.js syntax extensions
var sectionRegExp = /(\|{3,5})(?!\|)((?:\\\||(?!\1).)*?)\1(.*)\n/g;
var firstSectionRegExp = new RegExp(sectionRegExp, "");
var imprintRegExp = /(?:(?:^|\n)(```+|~~~+)imprint\s*?\n([\s\S]*?)\n\1|(?:^|\n)(<!--+)imprint\s*?\n([\s\S]*?)\n--+>)/;
var metaBlockRegExp = /(?:(?:^|\n)(---+)\n([\s\S]*?)\n\1|(?:^|\n)(<!--+)meta\n([\s\S]*?)\n--+>)/;
var metaBlockElementsRegExp = /(?:(?:^|\n)[ \t]*(\w+)\s*:\s*(["'`])((?:\\\2|(?!\2)[\s\S])*?)\2|(?:^|\n)[ \t]*(\w+)\s*:\s*([^\n]*))/g;

// elearn.js additional comments
var hideInOverviewRegExp = /\s*<!--hide-in-overview-->/g;
var noSectionRegExp = /\s*<!--no-section-->/g;
var secDescriptionRegExp = /[ \t]*<!--desc[ \t]+(.*?)[ \t]*-->/g;
var secDescriptionReplacementRegExp = /desc="elearnjs-section-description-(\d+)"/g;

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

var descrIndex = 0;
var descriptions = {};


const addSectionOnHeading = {
    type: 'lang',
    filter: (text, converter) => {
        const headingDepth = atom.config.get('atom-elearnjs.generalConfig.newSectionOnHeadingDepth');

        const useSubSections = atom.config.get('atom-elearnjs.generalConfig.sectionOrder.useSectionLevel');
        const subSection = atom.config.get('atom-elearnjs.generalConfig.sectionOrder.sub');
        const subSubSection = atom.config.get('atom-elearnjs.generalConfig.sectionOrder.subsub');

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
                        var description = content.match(secDescriptionRegExp);
                        content = content.replace(secDescriptionRegExp, "");

                        description = description && description.length ? description[0].trim() : "";

                        // default section
                        if(!useSubSections
                                || type.length < subSection) {
                            ret = `|||${escapeSectionName(content)}|||${hideInOverview}${description}\n` + ret;
                        }
                        else if(type.length < subSubSection) {
                            ret = `||||${escapeSectionName(content)}||||${hideInOverview}${description}\n` + ret;
                        }
                        else {
                            ret = `|||||${escapeSectionName(content)}|||||${hideInOverview}${description}\n` + ret;
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
        const conv = converter;
        // clear descriptions, this will be used for replacement of descr. tags
        var match = text.match(firstSectionRegExp);
        if(match && match.length) {
            // replace only first
            text = text.replace(firstSectionRegExp, (wholeMatch, wrap, heading, addition) => {
                return parseSection(conv, wholeMatch, wrap, heading, addition);
            });
            // replace all following
            text = text.replace(sectionRegExp, (wholeMatch, wrap, heading, addition) => {
                return `</section>${parseSection(conv, wholeMatch, wrap, heading, addition)}`;
            });
            text += "</section>";
        }

        return text;
    }
};

const pdfSectionSyntax = {
    type: 'lang',
    filter: (text, converter) => {
        const conv = converter;
        var replacement = atom.config.get('atom-elearnjs.pdfConfig.newPageOnSection') ? '<div style="page-break-before: always;">' : '';

        var match = text.match(firstSectionRegExp);
        if(match && match.length) {
            // replace only first
            text = text.replace(firstSectionRegExp, (wholeMatch, wrap, heading, addition) => {
                return parseSection(conv, wholeMatch, wrap, heading, addition);
            });
            // replace all following
            text = text.replace(sectionRegExp, (wholeMatch, wrap, heading, addition) => {
                return `</section>${replacement}${parseSection(conv, wholeMatch, wrap, heading, addition)}`;
            });
            text += "</section>";
        }

        return text;
    }
};

const insertSectionDescription = {
    type: 'output',
    filter: (text, converter) => {
        text = text.replace(secDescriptionReplacementRegExp,
            (wholeMatch, index) =>
        {
            var desc = descriptions && descriptions[index] ? `desc="${descriptions[index]}"` : '';
            delete descriptions[index];
            return desc;
        });
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
            var code = delim1 ? codeblock1 : (delim2 ? codeblock2 : undefined);
            if(!code) return null;

            // remove indention up to 4 spaces (1 tab)
            var shortestIndention = code.replace(/(^|\n)\t/g, "$1    ")
                .match(indentionRegExp)
                .reduce((minIndent, match) => {
                    return Math.min(minIndent, match.replace(/\n/g, "").length)
                }, 4);
            code = removeIndention(code, shortestIndention, 4);

            imprint = converter.makeHtml(code);
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

const cleanSectionDescriptionComment = {
    type: 'listener',
    listeners: {
        'headers.before': (event, text, options, globals) => {
            text = text.replace(secDescriptionRegExp, "");
            return text;
        }
    }
}

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

const cleanMarkdownAttribute = {
    type: 'output',
    filter: (text, converter) => {
        // check for HTML elements containing a markdown attribute
        var markdownAttributeRegExp = /<(\S+)((?:[ \t]+(?!markdown[ \t]*=[ \t]*["'])\S+[ \t]*=[ \t]*(["'])(?:\\\3|(?!\3).)*\3)*)([ \t]+markdown[ \t]*=[ \t]*(["'])(?:\\\5|(?!\5).)*\5)([^>]*)>/gi;
        return text.replace(markdownAttributeRegExp,
            (wholeMatch, tag, before, wrapBefore, attr, wrap, after, closingSlash) =>
        {
            // remove the attribute
            return wholeMatch.replace(attr, "");
        });
    }
};

var elearnHtmlBody = () => {
    return [
        addSectionOnHeading,
        cleanNoSectionComment,
        cleanHideInOverviewComment,
        cleanSectionDescriptionComment,
        replaceSectionSyntax,
        insertSectionDescription,
        removeMetaBlock,
        removeImprintBlock,
        cleanEmptyParagraphs,
        cleanMarkdownAttribute,
    ];
}

var elearnPdfBody = () => {
    return [
        addSectionOnHeading,
        cleanNoSectionComment,
        cleanHideInOverviewComment,
        cleanSectionDescriptionComment,
        pdfSectionSyntax,
        insertSectionDescription,
        removeMetaBlock,
        removeImprintBlock,
        cleanEmptyParagraphs,
        cleanMarkdownAttribute,
    ];
}

var elearnImprint = () => {
    return [parseImprint];
}

var parseSection = (converter, wholeMatch, wrap, heading, addition) => {
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
    if(addition.indexOf(`<!--hide-in-overview-->`) >= 0) hide = "hide-in-overview";
    // set class attribute
    var clazz = sub || hide ? ` class="${sub}${sub && hide ? ' ' : ''}${hide}"` : '';

    // check descriptions
    var desc = '';
    if(addition.match(secDescriptionRegExp)) {
        var descriptionContent = '';
        addition.replace(secDescriptionRegExp, (wholeMatch, content) => {
            descriptionContent = content;
            return '';
        });
        var desc = ` desc="elearnjs-section-description-${descrIndex}"`;
        descriptions[descrIndex] = converter.makeHtml(escapeHTMLQuotes(descriptionContent)).replace(/^<p>/g, "").replace(/<\/p>$/g, "");
        descrIndex++;
    }

    return `<section markdown="1" name="${heading}"${clazz}${desc}>\n`;
};

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

/**
* Removes up to @param indentionSize spaces (or tabs if tabsize <= indentionSize)
* from the beginning of each line.
*/
var removeIndention = (block, indentionSize, tabSize) => {
    if(indentionSize === 0) return block;
    if(indentionSize === undefined) indentionSize = 4;
    if(tabSize === undefined) tabSize = 4;
    var tabsRemoved = parseInt(indentionSize / tabSize);
    var spaceRegExp = new RegExp(`(^|\n)([ ]{1,${indentionSize}}${tabsRemoved > 0 ? `|\\t{1,${tabsRemoved}}` : ""})`, "g");
    return block.replace(spaceRegExp, (wholeMatch, lineBreak, indention) => {
        return lineBreak;
    });
}

module.exports.elearnHtmlBody = elearnHtmlBody;
module.exports.elearnPdfBody = elearnPdfBody;
module.exports.elearnImprint = elearnImprint;
module.exports.parseMetaData = parseMetaData;
