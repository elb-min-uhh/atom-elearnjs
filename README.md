# Atom elearn.js

This package converts Markdown files to HTML and PDF and is specifically
designed to use [elearn.js](https://github.com/elb-min-uhh/elearn.js) for styling
and interactive elements.

## Installation

Simply search for `atom-elearnjs` in Atom's Settings view to install this
package.

## Usage

In Atom open your Markdown file. Afterwards you can do either of the following:

* use the Package tab, access elearn.js and convert to either html or pdf.
* Right-Click in the editor window and choose `elearn.js - to HTML` or
`elearn.js - to PDF`
* Convert with hotkeys:
    * To HTML: `ctrl-alt-o`
    * To PDF: `ctrl-alt-p`

## Additions to Markdown Syntax

To add additional meta information or scripts to the HTML Head you can use the
following syntax.

### Meta Information

The following block has to be added to the markdown file (preferably at the top)
to add meta information to the generated HTML-File.

    ---
    Title: elearn.js Template
    Author: Name Author
    Description: Enter Descriptions
    Keywords: Key, Words
    Custom: "<script type=\"text/x-mathjax-config\">
                MathJax.Hub.Config({
                    extensions: [\"tex2jax.js\"],
                    jax: [\"input/TeX\", \"output/HTML-CSS\"],
                    tex2jax: {
                        inlineMath: [ ['$','$'], [\"\\(\",\"\\)\"] ],
                        displayMath: [ ['$$','$$'], [\"\\[\",\"\\]\"] ],
                        processEscapes: true
                    },
                    \"HTML-CSS\": { availableFonts: [\"TeX\"] }
                });
            </script>
            <script type=\"text/javascript\"
                src=\"https://cdn.mathjax.org/mathjax/latest/MathJax.js\"></script>"
    ---

This will basically add `<meta>` elements to the HTML's Head.
For example `Author: Name Author` will be converted to
`<meta name="author" content="Name Autor"/>`. There are only two exceptions to
this rule.

* `Title` will convert to a `<title>` element.
* `Custom` will add the value without any conversion to the Head.
In this example the MathJax Script is loaded and initiated.

If you want to write a value over multiple lines you can surround it with `'`
or `"` otherwise it will only get interpreted as single line value.

All fields are optional as well as the block itself.


### elearn.js Imprint

In the HTML version's menu of an elearn.js document is an imprint. To add your
imprint information you have to add the following block to the markdown code.

    ```imprint
      YOUR CODE HERE
    ```

Within these block either markdown or html is allowed.

This block is optional but it is recommended to insert this block at the top of
your markdown file.

## Planned Features

* Add settings for:
    * _HTML and PDF_:
        * Optional MathJax integration
        * Optional CSS File for additional styles
    * _PDF only_:
        * Page break before section (on/off)
        * Optional footer text
        * Zoom Factor

## Known Issues

* All platforms:
    * PDF output might break elements at page end (e.g. lines might be broken
        horizontally)
        * Workaround: add forced page break `<div style="page-break-before: always;"></div>`
* Linux (Ubuntu):
    * PDF output is zoomed
        * Workaround: zoom factor ~0.7
    * PDF output has no footer/page numbers.

## License

atom-elearnjs is developed by [dL.MIN](https://www.min.uni-hamburg.de/studium/elearning.html) of Universität Hamburg.

The software is using [MIT-License](http://opensource.org/licenses/mit-license.php).

Copyright (c) 2018 Michael Heinecke, dL.MIN, Universität Hamburg
