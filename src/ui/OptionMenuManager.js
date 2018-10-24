"use babel";
"use strict";

import OptionMenu from "./OptionMenu";

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
    *                      these will result in a return value of their index
    *           - header: String: Header text
    */
    open(opts) {
        const self = this;

        if(self.openMenu && !self.openMenu.isVisible) {
            self.close();
        }

        if(self.openMenu) throw "Menu already open";

        return new Promise((res) => {
            // display
            self.openMenu = new OptionMenu(opts, function() {
                self.destroyMenu();
                res.apply(null, arguments);
            });
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
        });
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
        let heading = document.createElement('h3');
        if(!containsHTML) heading.textContent = text;
        else heading.innerHTML = text;
        return heading;
    }

    static getDescription(text, containsHTML) {
        let desc = document.createElement('span');
        desc.classList.add('description');
        if(!containsHTML) desc.textContent = text;
        else desc.innerHTML = text;
        return desc;
    }

    static getCheckBoxLabel(text, checked, containsHTML) {
        let label = document.createElement('label');

        let checkbox = document.createElement('input');
        checkbox.classList.add('input-checkbox');
        checkbox.type = "checkbox";
        checkbox.checked = checked;
        label.appendChild(checkbox);

        let span = document.createElement('span');
        if(!containsHTML) span.textContent = text;
        else span.innerHTML = text;
        label.appendChild(span);

        label.checkbox = checkbox;

        return label;
    }

    static getSelectLabel(text, options, selected, containsHTML) {
        let label = document.createElement('label');

        let span = document.createElement('span');
        if(!containsHTML) span.textContent = text;
        else span.innerHTML = text;
        label.appendChild(span);

        let select = document.createElement('select');
        select.classList.add('form-control');
        for(let opt of options) {
            let o = document.createElement('option');
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

export default OptionMenuManager;
