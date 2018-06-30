"use babel";
"use strict";

import { CompositeDisposable } from 'atom';

class CommandListener {
    constructor(fileWriter, elearnJSMenuManager) {
        this.fileWriter = fileWriter;
        this.elearnJSMenuManager = elearnJSMenuManager;

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
                'atom-elearnjs:toggle-display-export-options': () => {
                    self.toggleDisplayExportOptions();
                },
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

    toggleDisplayExportOptions() {
        // toggle setting
        atom.config.set('atom-elearnjs.generalConfig.displayExportOptions',
            !atom.config.get('atom-elearnjs.generalConfig.displayExportOptions'));
    }
}

export default CommandListener;
