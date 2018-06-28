"use babel";

const OptionMenuManager = require('./ui/OptionMenuManager.js');
const ElearnJSMenuManager = require('./ui/ElearnJSMenuManager.js');
const CommandListener = require('./ui/CommandListener.js');
const FileWriter = require('./export/FileWriter.js');
var config = require('../spec/config.js');

// This is your main singleton.
// The whole state of your package will be stored and managed here.
const Main = {
    commandListener: null,
    config: config,
    activate(state) {
        if(!this.optionMenuManager) {
            this.optionMenuManager = new OptionMenuManager();
        }
        if(!this.fileWriter) {
            this.fileWriter = new FileWriter(this.optionMenuManager);
        }
        if(!this.elearnJSMenuManager) {
            this.elearnJSMenuManager = new ElearnJSMenuManager();
        }
        if(!this.commandListener) {
            this.commandListener = new CommandListener(this.fileWriter, this.elearnJSMenuManager);
        }

        if(state) {
            if(state["FileWriter"]) this.fileWriter.deserialize(state["FileWriter"]);
        }
    },
    deactivate() {
        // When the user or Atom itself kills a window, this method is called.
    },
    serialize() {
        // To save the current package's state, this method should return
        // an object containing all required data.
        return {
            "FileWriter": this.fileWriter.serialize(),
        }
    },
};

export default Main;
