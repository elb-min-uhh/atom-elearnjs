"use strict";

class ElearnJSMenuManager {
    constructor() {
        this.submenu = this.getPackageSubmenu();

        this.updateDisplayExportOptions();

        this.initListeners();
    }

    initListeners() {
        const self = this;
        atom.config.onDidChange('atom-elearnjs.generalConfig.displayExportOptions', () => {
            self.updateDisplayExportOptions();
        });
    }

    getPackageSubmenu() {
        var submenu = null;
        for(var menu of atom.menu.template) {
            if(menu.label === 'Packages' || menu.label === '&Packages') {
                for(var sub of menu.submenu) {
                    if(sub.label === 'elearn.js') {
                        submenu = sub.submenu;
                        break;
                    }
                }
                break;
            }
        }
        return submenu;
    }

    updateDisplayExportOptions() {
        if(!this.submenu || !this.submenu[3]) return;

        if(atom.config.get('atom-elearnjs.generalConfig.displayExportOptions')) {
            this.submenu[3].label = `✔ Always display export options`;
        }
        else {
            this.submenu[3].label = `Always display export options`;
        }
        atom.menu.update();
    }
}

module.exports = ElearnJSMenuManager;
