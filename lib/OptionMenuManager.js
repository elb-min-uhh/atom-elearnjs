"use strict";

const {dialog} = require('electron').remote;

const OptionMenu = require("./OptionMenu.js");

class OptionMenuManager {
    constructor() {
        this.openMenu = null;
    }

    /**
    * Creates an option menu.
    * @param opts: an Object containing:
    *           Optional:
    *           - content: optional dom elements to add to the menu
    *           - buttons: String[]: array of elements. Defaults to ["Cancel", "Ok"];
    *                      these will result in a return value of their index for
    *                      the callback function
    *           - header: String: Header text
    * @param callback fnc(val): function that will be called on Close
    */
    open(opts, callback) {
        const self = this;

        if(self.openMenu && !self.openMenu.isVisible) {
            self.close();
        }

        if(self.openMenu) throw "Menu already open";
        else if(!callback || typeof callback !== "function") throw "No callback function given";

        const originalCallback = callback;
        // overwrite callback
        const onClose = function() {
            originalCallback.apply(null, arguments);
            self.destroyMenu();
        };

        // display
        self.openMenu = new OptionMenu(opts, onClose);
        self.modalPanel = atom.workspace.addModalPanel({
            item: self.openMenu.getElement(),
            visible: true
        });
        self.openMenu.selectDefaultButton();
    }

    close() {
        this.openMenu.close(-1);
    }

    destroyMenu() {
        if(this.modalPanel) {
            this.modalPanel.destroy();
            this.modalPanel = null;
        }
        if(this.openMenu) {
            this.openMenu.destroy();
            this.openMenu = null;
        }
    }

    static getCheckBoxLabel(text, checked) {
        var label = document.createElement('label');

        var checkbox = document.createElement('input');
        checkbox.classList.add('input-checkbox');
        checkbox.type = "checkbox";
        checkbox.checked = checked;
        label.appendChild(checkbox);

        var span = document.createElement('span');
        span.textContent = text;
        label.appendChild(span);

        label.checkbox = checkbox;

        return label;
    }
}

module.exports = OptionMenuManager;
