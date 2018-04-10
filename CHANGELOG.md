## 0.2.5 (not released)
* General:
    * Add hints for backslash usage
    * Fix backslash unescaping in section names
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
