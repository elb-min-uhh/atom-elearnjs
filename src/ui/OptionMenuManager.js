"use strict";

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
        self.modalPanel.getItem().addEventListener("keyup", (e) => {
            // ESC
            if(e.keyCode === 27) {
                self.close();
            }
        });
        self.openMenu.selectDefaultButton();
    }

    close() {
        this.openMenu.close();
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

    static getHeading(text, containsHTML) {
        var heading = document.createElement('h3');
        if(!containsHTML) heading.textContent = text;
        else heading.innerHTML = text;
        return heading;
    }

    static getDescription(text, containsHTML) {
        var desc = document.createElement('span');
        desc.classList.add('description');
        if(!containsHTML) desc.textContent = text;
        else desc.innerHTML = text;
        return desc;
    }

    static getCheckBoxLabel(text, checked, containsHTML) {
        var label = document.createElement('label');

        var checkbox = document.createElement('input');
        checkbox.classList.add('input-checkbox');
        checkbox.type = "checkbox";
        checkbox.checked = checked;
        label.appendChild(checkbox);

        var span = document.createElement('span');
        if(!containsHTML) span.textContent = text;
        else span.innerHTML = text;
        label.appendChild(span);

        label.checkbox = checkbox;

        return label;
    }

    static getSelectLabel(text, options, selected, containsHTML) {
        var label = document.createElement('label');

        var span = document.createElement('span');
        if(!containsHTML) span.textContent = text;
        else span.innerHTML = text;
        label.appendChild(span);

        var select = document.createElement('select');
        select.classList.add('form-control');
        for(var opt of options) {
            var o = document.createElement('option');
            o.value = opt.value;
            o.textContent = opt.text;
            select.appendChild(o);
        }
        select.value = selected;
        label.appendChild(select);

        label.select = select;

        return label;
    }
}

module.exports = OptionMenuManager;
