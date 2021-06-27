"use babel";

import { remote } from 'electron';
const dialog = remote.dialog;

class Util {
    /**
    * Opens a file chooser. Might return a cached filePath if allowed.
    * @param fileTypes of Type String[] or String. Allowed filetypes. e.g
    *                  "HTML" or ["HTML", "PDF"]
    * @param allowQuickSave (optional) can only be set if `fileTypes` is of
    *                       type String because this will only be done if only
    *                       one type is given.
    */
    static async openFileChooser(fileTypes, inputPath) {
        let defaultPath = inputPath;
        let filters = [{ name: "All Files", extensions: ["*"] }];

        // array of filetypes
        if(Object.prototype.toString.call(fileTypes) === '[object Array]') {
            let newFilters = [];
            for(let type of fileTypes) {
                newFilters.push({ name: type.substr(1), extensions: [type.toLowerCase().substr(1)] });
            }
            newFilters.push(filters[0]);
            filters = newFilters;
        }
        // single filetype as string
        else {
            filters.unshift({ name: fileTypes.substr(1), extensions: [fileTypes.substr(1).toLowerCase()] });
        }

        //#6 fix empty Promise with async implementation in newer atom versions.
        let filePath = dialog.showSaveDialogSync({
                defaultPath: defaultPath,
                filters: filters,
        });

        return filePath;
    }
}

export default Util;
