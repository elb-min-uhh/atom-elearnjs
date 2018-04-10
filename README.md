# Atom elearn.js

This package converts Markdown files to HTML and PDF and is specifically
designed to use [elearn.js](https://github.com/elb-min-uhh/elearn.js) for styling
and interactive elements.

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

## Settings

You can change the settings of this atom package by clicking on the tab
_Packages_ and then go to _Settings_->_Manage Packages_. Search for
_atom-elearnjs_ and click on _Settings_.

Settings are divided into groups. _General_ settings will most likely affect
all outputs. _HTML_ and _PDF_ will only affect their specific output. These
settings are all global, meaning that they affect all markdown files you
convert with _atom-elearnjs_.

The settings are further described here.

### General

* __Keep export locations after exit__:
    * On export your selection export location will be stored and reused.
        This way you are not prompted everytime you want to export your file
    * Check this option to keep this stored location even after closing atom
    * You can only overwrite your export location by using
        _elearn.js - Save as..._
* __Keep export option defaults after exit__:
    * On export you might be prompted with additional export options.
        Your selected options will be stored as defaults for you next export.
        This way you can export faster by just confirming your previous options
    * Activate this option to keep this information even after closing atom
* __Always display export options__:
    * On export you might be prompted with additional export options
    * Deactivating this option will always reuse your stored defaults
    * To change your stored defaults you have to activate this option again
    * You can also toggle this option via the _Package Menu - elearn.js -
        Always display export options_
* __Start a new section at headings__:
    * This will automatically detect headings
    * Only markdown style headings with hashes (#),
        not underlined headings (= or -)
    * Sections are used by elearn.js to create pages
    * For further information about sections read the _sections_ part in
        __Additions to Markdown Syntax__
* __New sections up to depth__:
    * Only if _Start a new section at headings_ is on
    * This will define which headings are used to create sections
    * e.g. _H3 - ### Heading_ will activate automatic section generation for
        * _H1 - # Heading_
        * _H2 - ## Heading_
        * _H3 - ### Heading_
    * For further information about sections read the _sections_ part in
        _Additions to Markdown Syntax_

### HTML

* __Section Order__:
    * The following options are used for elearn.js section levels
    * There are three levels: _Section_, _Subsection_, _Subsubsection_
    * This sections are only displayed differently in content overviews
    * _Create section levels_: Activates or deactivates leveling of sections
    * _Subsection_: The highest heading level to be interpreted as _subsection_
    * _Subsubsection_: The highest heading level to be interpreted as
        _subsubsection_

### PDF

* __Start a new page at a section start__:
    * Works with automatically generated sections by
        _Start a new section at headings_ and the extended syntax described below
* __Zoom of PDF Output__:
    * Will zoom all of the content by this factor
    * Can be used e.g. to make the font bigger/smaller
    * 0.5: half the size, 1: no zoom, 2: double the size
    * Can be used as a fix for a zoom issue. See __Known Issues__
* __Delay of HTML rendering__:
    * The page is calculated as html in the background and then rendered to pdf
    * Adds a wait time to make sure all the scripts are done
    * The value is in seconds
* __Custom header/footer text__:
    * Each can be set to html based on https://github.com/marcbachmann/node-html-pdf#footers-and-headers
    * Make sure to only use `id="pageHeader"` in the header field and
        `id="pageFooter"` in the footer field
    * Both will be added without any changes to the HTML before rendering
    * You can change the style by adding a `style` attribute
    * You can add special footers (e.g. `id="pageFooter-first"`) by just writing
        all elements one after another
* __Header/Footer height__:
    * Changes internal settings of header and footer height
    * Check https://github.com/marcbachmann/node-html-pdf#options for more
        information on supported values
* __CSS Stylesheet__:
    * You can insert an absolute path to add an additional CSS file
    * This file can overwrite elearn.js specific styles for the PDF Output


## Additions to Markdown Syntax

To use additional elearn.js features or add meta information or
scripts to the HTML Head you can use the following syntax.

### Sections

Sections are automatically created at headings. These sections are used by
_elearn.js_ to create pages. This can be changed in the
_settings_ of this atom package. By default headings up to `### Heading 3`
will start a new section with the name set to the headings text.

If you only want a specific heading to not start a new section, insert
`<!--no-section-->` into the headings text like this:

    ## Example Heading <!--no-section-->

If you disable this option or want a new section at a specific point, you can
insert

    |||SECTION_NAME|||

This way the html will contain a surrounding `<section name="SECTION_NAME">`.

There are also syntax extensions for _subsections_ and _subsubsections_

    ||||SUB_SECTION||||
    |||||SUB_SUB_SECTION|||||

If you want to use `|` as a character wihtin the sections name, you have to
escape it with an `\`. So `|` becomes `\|` like this
`||| Example \| Section 1|||`. Using normal markdown headings with autogenerated
sections like `## Example | Section 1` is still possible without further
escaping. Also `\` chars always have to be escaped when you want to write them
as a character in a text. See the _Useful Hints_ section below for further
information.

__Notice:__ You should always insert the first section before everything else
(besides not displayed elements like the _meta information_ or _imprint_ below).
Other displayed elements before the first section will otherwise always be
visible.

#### Content Overview

Elearn.js has support for an automatically created content overview based on
sections. You can insert this overview by adding the following block

    <!-- Addition class="kachel" changes the style -->
    <!-- Addition class="hide-read" do not show checkmarks on read sections -->
    <div id="content-overview" class="kachel">
        <!-- Keep this empty. This will be automatically generated. -->
    </div>

If you want to hide sections in this overview e.g. the content overview section
itself you can add a comment like this

    ## Content Overview <!--hide-in-overview-->
    |||Content Overview||| <!--hide-in-overview-->

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
For example `Author: Name Author`, where `Author` might be called _Key_ and
`Name Author` _Value_, will be converted to
`<meta name="author" content="Name Autor"/>`. There are only two exceptions to
this rule.

* `Title` will convert to a `<title>` element.
* `Custom` will add the value without any conversion to the Head.
In this example the MathJax Script is loaded and initiated.

If you want to write a value over multiple lines you can surround it with `'`
or `"` otherwise it will only get interpreted as single line value. The chosen
wrapper has to be escaped within the value. This can also be seen in the example
above. Another example: `Title: An "Example" with quotes` is equal to
`Title: "An \"Example\" with quotes"` and `Title: 'An "Example" with quotes'`.

The `---` wrapping the block is necessary if you include this block.
All Key-Value pairs have to be within these `---` lines. If you want to be sure
the block will not be converted to anything else by other converters you can
also use the alternative syntax:

    <!--meta
      Title: elearn.js Template
      Author: ...
    -->

This way you are save to use this even when working with other converters. But
you cannot use `-->` in the block and atom will not highlight the syntax.

All fields are optional as well as the block itself.


### elearn.js Imprint

In the HTML version's menu of an elearn.js document is an imprint. To add your
imprint information you have to add the following block to the markdown code.

    <!--imprint
      YOUR CODE HERE
    -->

Within this block either markdown or html is allowed.

This block is optional but it is recommended to insert this block at the top of
your markdown file. This block should not be converted in other markdown
converters due to its html comment style. This way you are save to use
this even when working with other converters. But of course other converters
will not generate any output based on this block.
There are two alternatives to this syntax:

    ```imprint
      YOUR CODE HERE
    ```

and

    ~~~imprint
      YOUR CODE HERE
    ~~~

## Useful hints

### Usage of backslashes `\`

Wherever you want to use the char `\` in a markdown file you need to escape it.
This means writing `\\` will display only one `\`. As the atom syntax
highlighting implies it will otherwise be interpreted as escape for the
following character. Escaping means that you deactivate a characters
funcitonality. This might be used for \_ as a char (as `\_`) to not activate its
italic style function.

If you want to use __MathJax__ for example and use functions like `\frac{1}{2}`,
you need to write `\\frac{1}{2}` in the markdown file.

### Add custom style (.css)

To add your own stylesheet you can use the `Custom` key described in the
_Meta Information_ section. This will be pasted into the HTML file and also be
added before rendering a PDF file.

You can also use the _CSS Stylesheet_ setting, described earlier, to
use a specific file in every _.pdf_ file.

If you want to overwrite specific styles you should check on
https://github.com/elb-min-uhh/atom-elearnjs/tree/master/assets/elearnjs/assets/css
for the styles used in the HTML file (which is also used for the PDF export)
and additionally on
https://github.com/elb-min-uhh/atom-elearnjs/tree/master/assets/elearnjs/pdfAssets/css
for the overwriting styles only used for PDF exports.


### Section with custom name

If you use the automatically generated sections feature but want to rename
a specific section, you can do so by writing it as follows

    |||My Custom Section Name|||
    ## My Normal Section name <!--no-section-->

This way you deactivate the headings automatic section generation and add your
own.

__Notice:__ You should check your section depth settings to select the correct
section level in your custom section.


## Examples

You can find an example Markdown file in the _elearn.js_ repository
https://github.com/elb-min-uhh/elearn.js/blob/master/Template/elearn_template.md.
Due to GitHub's Markdown preview we suggest inspecting the Markdown source code.
You can also download the repository and export the file using _atom-elearnjs_
to compare the source with the output. Make sure to include the assets folder
from the repository, so you have all necessary images and other media files.

## Planned Features
* Wiki Page for explanation to shorten README
* _General_:
    * Syntax extensions for elearn.js elements
    * Snippets for elearn.js elements
    * Live preview
* _HTML and PDF_:
    * Automated video and quiz detection to add elearn.js extensions
    * Optional (automated) MathJax integration

## Known Issues

* All platforms:
    * PDF output might break elements at page end (e.g. lines might be broken
        horizontally)
        * Workaround: add forced page break
            `<div style="page-break-before: always;"></div>`
* Linux/Mac OS:
    * PDF output is zoomed
        * Workaround: zoom factor of ~0.7

## Credits

* [Atom](https://atom.io) the editor you need!
* [Showdown](http://showdownjs.com/) used for Markdown to HTML conversion.
* [marcbachmann/node-html-pdf](https://github.com/marcbachmann/node-html-pdf)
used for HTML to PDF conversion.

## License

atom-elearnjs is developed by
[dl.min](https://www.min.uni-hamburg.de/studium/digitalisierung-lehre/ueber-uns.html)
of Universität Hamburg.

The software is using [MIT-License](http://opensource.org/licenses/mit-license.php).

cc-by Michael Heinecke, Arne Westphal, dl.min, Universität Hamburg
