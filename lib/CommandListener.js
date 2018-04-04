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
                'atom-elearnjs:to-html': () => { self.toHTML(); },
                'atom-elearnjs:to-pdf': () => { self.toPDF(); },
                'atom-elearnjs:save-as': () => { self.saveAs(); },
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

    saveAs() {
        const self = this;
        self.fileWriter.saveAs();
    }
};

export default CommandListener;
