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
                'elearnjs-plugin:to-html': () => { self.toHTML(); },
                'elearnjs-plugin:to-pdf': () => { self.toPDF(); },
            })
        );
    }

    toHTML() {
        const self = this;
        self.fileWriter.writeHTML();
    }

    toPDF() {
        const self = this;
        self.fileWriter.writePDF();
    }
};

export default CommandListener;
