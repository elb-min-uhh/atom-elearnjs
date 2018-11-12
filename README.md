# Atom elearn.js

This package converts Markdown files to HTML and PDF and is specifically
designed to use [elearn.js](https://github.com/elb-min-uhh/elearn.js) for styling
and interactive elements.

Create a simple _elearn.js_ based script in no time!

![atom-elearnjs Demo Video](https://raw.githubusercontent.com/elb-min-uhh/atom-elearnjs/master/images/demo.gif)

## Installation

Simply search for `atom-elearnjs` in Atom's Settings view to install this
package.

## Usage

In Atom open your Markdown file. Afterwards you can do any of the following:

* use the Package tab, access elearn.js and convert to either html or pdf
* Right-Click in the editor window and choose `elearn.js - to HTML` or
`elearn.js - to PDF`
* you can also use `Save as...` in the menus described above to select an
output location
* Convert with hotkeys:
    * To HTML: `ctrl-alt-o`
    * To PDF: `ctrl-alt-p`

All locations will be stored by their output _type_ and the _markdown file_
and will only be overwritten when `Save as...` (described above) is used.

Markdown syntax is supported based on [Showdown's](http://showdownjs.com/)
features. If you want to use specific _elearn.js_ features check the
[extended documentation](#extended-documentation).

## Extended Documentation

Check our [wiki pages](https://github.com/elb-min-uhh/atom-elearnjs/wiki) for
examples and detailed documentation.

There are also
[useful hints](https://github.com/elb-min-uhh/atom-elearnjs/wiki/Useful-Hints)
for beginners or troubleshooting.

## Known Issues

* All platforms:
    * PDF output might be slow
        * consider keeping Chrome alive after the first export (check settings)

## Credits

* [Atom](https://atom.io) the editor you need!
* [elearn.js](https://github.com/elb-min-uhh/elearn.js) based for output scripts and styles.
* [Showdown](http://showdownjs.com/) used for Markdown to HTML conversion.
* [Puppeteer](https://github.com/GoogleChrome/puppeteer)
used for HTML to PDF conversion.

## License

atom-elearnjs is developed by
[dl.min](https://www.min.uni-hamburg.de/studium/digitalisierung-lehre/ueber-uns.html)
of Universität Hamburg.

The software is using [MIT-License](http://opensource.org/licenses/mit-license.php).

cc-by Michael Heinecke, Arne Westphal, dl.min, Universität Hamburg
