"use babel";
"use strict";

import { CompositeDisposable } from 'atom';
const FileWriter = require('./FileWriter.js');

class CommandListener {
    constructor(fileWriter) {
        this.fileWriter = fileWriter;

        // Assign a new instance of CompositeDisposable...
        this.subscriptions = new CompositeDisposable();

        this.initListeners();
    }

    initListeners() {
        const self = this;
        // ...and adding commands.
        this.subscriptions.add(
            atom.commands.add('atom-workspace', {
                'elearnjs-plugin:toggle': () => { self.toggle(); },
            })
        );
    }

    toggle() {
        const self = this;

        self.fileWriter.writeHTML();
    }
};

export default CommandListener;
