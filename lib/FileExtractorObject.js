"use strict";

/**
* Used to return information about file extraction process.
* Contains changed HTML (replaced relative links)
* and found files.
*/
class FileExtractorObject {
    /**
    * @param html: string of html after fileExtraction,
    *              all `files` are changed in the html.
    *              if `files` is empty, the html was not changed by the
    *              FileExtractor parsing
    * @param files: fileInfo[], containing multiple files of type
    *               {relativeInputPath: ..., relativeOutputPath: ...}
    */
    constructor(html, files) {
        if(html) this.html = html;
        if(files) this.files = files;
    }
}

module.exports = FileExtractorObject;
