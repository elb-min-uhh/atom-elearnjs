"use babel";

const FileWriter = require('./FileWriter.js');
const CommandListener = require('./CommandListener.js');
var config = require('./config.js');

// This is your main singleton.
// The whole state of your package will be stored and managed here.
const Main = {
    commandListener: null,
    config : config,
    activate (state) {
        if(!this.fileWriter) {
            this.fileWriter = new FileWriter();
        }
        if(!this.commandListener) {
            this.commandListener = new CommandListener(this.fileWriter);
        }

        if(state) {
            if(state["FileWriter"]) this.fileWriter.deserialize(state["FileWriter"]);
        }
    },
    deactivate () {
        // When the user or Atom itself kills a window, this method is called.
    },
    serialize () {
        // To save the current package's state, this method should return
        // an object containing all required data.
        return {
            "FileWriter": this.fileWriter.serialize(),
        }
    },
};

export default Main;
