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
            self.openMenu = new OptionMenu(opts, function(val) {
                res({
                    values: self.parseValues(self.modalPanel.getItem()),
                    returnValue: val,
                });
                self.destroyMenu();
            });
            self.modalPanel = atom.workspace.addModalPanel({
                item: self.openMenu.getElement(),
                visible: true
            });

            const onKeyUp = (e) => {
                switch(e.keyCode) {
                    // Enter
                    case 13: self.close(1); break;
                    // Esc
                    case 27: self.close(); break;
                }
            };
            self.modalPanel.getItem().addEventListener("keyup", onKeyUp);
            let inputs = self.modalPanel.getItem().querySelectorAll('input');
            for(let input of inputs) {
                input.addEventListener("keyup", onKeyUp);
            }

            self.openMenu.selectDefaultButton();
        });
    }

    close(val) {
        if(this.openMenu) this.openMenu.close(val);
    }

    parseValues(body) {
        let inputs = body.querySelectorAll('input,select');

        // create submit function
        // parse all values
        let values = {};
        for(let input of inputs) {
            switch(input.type) {
                case "checkbox":
                case "radio":
                    values[input.name] = input.checked;
                    break;
                default:
                    values[input.name] = input.value;
                    break;
            }

            if(input.type === "number") {
                try {
                    values[input.name] = parseFloat(input.value);
                }
                catch(err) {
                    // ignore
                }
            }
        }

        return values;
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

    /**
     * Creates an option block.
     * @param heading The blocks heading.
     * @param content The blocks content.
     */
    static createBlock(heading, content) {
        return `<h3>${heading}</h3>${content}`;
    }

    /**
     * Create a description element.
     * @param content the elements content as HTML.
     */
    static createDescription(content) {
        return `<span class="description">${content}</span>`;
    }

    /**
     * Create a checkbox label element.
     * @param name the name of the input element.
     *  This will be used in the `OptionMenuResult.values` as the key
     * @param text the elements text as HTML.
     * @param checked whether the checkbox is checked by default or not
     */
    static createCheckBoxLabel(name, text, checked) {
        let input = `<input type="checkbox" class="input-checkbox" name="${name}" ${checked ? "checked" : ""}/>`;
        return `<label>${input} <span>${text}</span></label>`;
    }

    /**
     * Create a input text label element.
     * @param name the name of the input element.
     *  This will be used in the `OptionMenuResult.values` as the key
     * @param text the describing text for the input
     * @param defaultVal the default text
     */
    static createInputNumberLabel(name, text, defaultVal, placeholder) {
        let input = `<input class="input-text native-key-bindings" type="number" step="any" name="${name}" value="${defaultVal}" placeholder="${placeholder ? placeholder : 0}" />`;
        return `<label><span>${text}</span>${input}</label>`;
    }

    /**
     * Create a checkbox label element.
     * @param name the name of the input element.
     *  This will be used in the `OptionMenuResult.values` as the key
     * @param options all selectable options
     * @param selectedValue the SelectOption.value of the selected option
     * @param description a description text
     */
    static createSelectLabel(name, options, selectedValue, description) {
        let optionsHtml = "";
        for(let opt of options) {
            optionsHtml += `<option value="${opt.value}" ${opt.value === selectedValue ? "selected" : ""}>${opt.text}</option>`;
        }
        return `<label>${description ? OptionMenuManager.createDescription(description) : ""}
                    <select class="form-control" name="${name}" value="${selectedValue}">${optionsHtml}</select>
                </label>`;
    }
}

export default OptionMenuManager;
