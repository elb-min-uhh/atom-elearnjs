## 0.5.2
* General:
    * Updated `markdown-elearnjs` to v1.4.6
        * handling of parallel pdf conversions improved
## 0.5.1
* General:
    * Updated `markdown-elearnjs` to v1.4.2
        * Chrome can be kept alive, to reduce conversion time
## 0.5.0
* General:
    * Updated `markdown-elearnjs` to v1.4.1
        * Use `Puppeteer` instead of `html-pdf`
        * Different `customHeader`/`customFooter` syntax
## 0.4.10
* General:
    * Updated `markdown-elearnjs` to v1.3.7
        * Updated PDF Output
        * Updated print css in HTML output
        * Fixing minor issues
## 0.4.9
* PDF:
    * Added an error message, when the pdf file is locked and can not
    be overwritten

## 0.4.8
* General:
    * Updated `markdown-elearnjs` to v1.3.3
        * Updated `clickimage.js` to support `data-pins` syntax
## 0.4.7
* General:
    * Allow language selection for PDF export
        * this will only change the language of customized translation elements
        * elearn.js elements which could be translated are not visible in a PDF
        document
    * Updated `markdown-elearnjs` to v1.3.2
## 0.4.6
* General:
    * Updated `markdown-elearnjs` to v1.2.12
        * Fixing compatibility with Internet Explorer
## 0.4.5
* General:
    * Updated `markdown-elearnjs` to v1.2.11
## 0.4.4
* General:
    * Updated `markdown-elearnjs` to v1.2.7
        * Fixing some specific bugs
* Internal:
    * Code clean up, refactoring
## 0.4.3
* General:
    * Updated `markdown-elearnjs` to v1.2.3
        * adjust to interface changes
        * possible performance improvements for file export
## 0.4.2
* General:
    * Updated `markdown-elearnjs` to v1.1.2
## 0.4.1
* General:
    * Updated `markdown-elearnjs` to v1.1.1
    * Removed assets from the repo (in `markdown-elearnjs` now)
## 0.4.0
* General:
    * Fixed indention problems with imprint and meta blocks
        * both can now be indented up to 4 spaces or 1 tab
    * Updated _elearn.js_ to include image gallery fixes
    * Extracted conversion code into `markdown-elearnjs` npm package
        * Use this package for conversion
## 0.3.2
* General:
    * Updated _elearn.js_ to v1.0.3, _quiz.js_ to v0.4.2 and _elearnvideo.js_
    to v0.4.2 to add Localization support
        * German as default language. English supported.
    * Added an export option for HTML export to enable language selection
## 0.3.1
* General:
    * Updated _elearn.js_ to v1.0.2
    * Updated _elearnvideo.js_ to support `stopping`
* HTML:
    * Export of linked files after bundled asset export
        * Makes it possible to overwrite bundled versions
    * _File successfully saved_ will be displayed correctly after everything was
    exported
        * Export of linked files was ignored before
## 0.3.0
* General:
    * Support for export of unsaved files
    * Settings rearranged
* HTML:
    * Support for section descriptions with `<--desc TEXT-->`
## 0.2.9
* General:
    * Updates for _elearn.js_ and all extensions
        * This includes bug fixes and new features
## 0.2.8
* General:
    * Supports more markdown syntax (strikethrough, tables, simple links)
    * Updated _elearn.js_, _elearnvideo.js_ and _quiz.js_
* PDF:
    * Fix of crash on eLearnJS interface functions
    * Display video note times for _elearnvideo.js_ videos
## 0.2.7
* General:
    * Selection of extensions whether to include them in an export or not
        * Per default the package will automatically detect which extensions
        should be included
    * Updated _elearn.js_ version to fix bugs
    * Updated _elearnvideo.js_ and _quiz.js_ and fixed print bugs
    * Support for _timeslider.js_ and _clickimage.js_
## 0.2.6
* General:
    * Remove markdown attribute in HTML Output
    * Fix unhandled markdown in section name
* PDF:
    * Hide elearn.js Quiz Feedbacks in Output
## 0.2.5
* General:
    * Add hints for backslash usage
    * Fix backslash unescaping in section names
    * Fix escaping of quotes in section names
## 0.2.4
* General:
    * Important fix for copy of linked files. Files will no longer be replaced
        with 0B of data
## 0.2.3
* General:
    * Setting whether to store export locations or not
    * Setting whether to store export options or not
    * Setting whether to prompt for export options or not
    * Change manual section syntax
    * Fix unescaped section wrap elements leading to not detected sections
## 0.2.2
* General:
    * Important fixes with paths for
        * export of elearn.js assets
        * PDF output
## 0.2.1
* General:
    * Clean up of the pdf only css styles
* HTML:
    * Added an option whether to export elearn.js assets or not
    * Added an option whether to export linked files or not
* PDF:
    * Added a setting for an additional CSS Stylesheet to be included in every
        pdf
## 0.2.0
* General:
    * Automatic section generation at headings (with config)
    * Leveled sections (syntax) and automatic generation
    * File chooser for export location
    * Syntax addition for in overview hidden sections
* PDF:
    * Optional PDF page break at section beginning (default on)
    * Optional Zoom for PDF output
    * Optional Render delay to wait for delayed scripts
    * Fixed footer and page number issues with Linux/Mac OS
    * Support for elearn.js content overview
    * Support for customized footer and header (global setting)
## 0.1.1
* Metadata and imprint blocks extended syntax
    * both can be written in HTML comment style
## 0.1.0 - First Release
* Basic Markdown to HTML and PDF conversion for elearn.js scripts
