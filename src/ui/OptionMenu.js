"use strict";

class OptionMenu {
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
    constructor(opts, callback) {
        if(!callback || typeof callback !== "function") return null;

        this.callback = callback;

        this.element = document.createElement('div');
        this.element.classList.add('atom-elearnjs-option-menu');

        this.header = document.createElement('div');
        this.header.classList.add('atom-elearnjs-option-menu-header');
        this.element.appendChild(this.header);
        this.body = document.createElement('div');
        this.body.classList.add('atom-elearnjs-option-menu-body');
        this.element.appendChild(this.body);
        this.footer = document.createElement('div');
        this.footer.classList.add('atom-elearnjs-option-menu-footer');
        this.element.appendChild(this.footer);

        // content
        if(opts.content) {
            this.body.appendChild(opts.content);
        }

        // header
        this.initHeader(opts.header);
        // footer
        this.initButtons(opts.buttons ? opts.buttons : ["Cancel", "Ok"]);
    }

    getElement() {
        return this.element;
    }

    /**
    * Close with a specific value.
    * @param val value of the closing interaction.
    *            usually it should be:
    *               - 0: cancel
    *               - 1: ok
    */
    close(val) {
        if(this.callback) this.callback(val);
        this.destroy();
    }

    destroy() {
        this.callback = null;
        this.element.remove();
    }

    initHeader(header) {
        if(!header) return;

        var heading = document.createElement('h2');
        heading.classList.add('panel-heading');
        heading.textContent = header;

        this.header.appendChild(heading);
    }

    initButtons(buttons) {
        const self = this;

        var buttonGroup = document.createElement('div');
        buttonGroup.classList.add('btn-group');

        for(var i = buttons.length - 1; i >= 0; i--) {
            const idx = i;
            var button = document.createElement('button');

            button.classList.add('atom-elearnjs-option-menu-button');
            button.classList.add('btn');
            if(i === buttons.length - 1) button.classList.add('btn-primary');

            button.textContent = buttons[i];
            button.addEventListener("click", () => { self.close(idx) });
            button.addEventListener("keyup", (e) => { if(e.keyCode === 13) self.close(idx) });
            buttonGroup.appendChild(button);

            if(!this.defaultButton) this.defaultButton = button;
        }

        self.footer.appendChild(buttonGroup);
    }

    selectDefaultButton() {
        this.defaultButton.focus();
    }
}

module.exports = OptionMenu;
