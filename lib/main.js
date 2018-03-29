"use babel";

const FileWriter = require('./FileWriter.js');
const CommandListener = require('./CommandListener.js');

// This is your main singleton.
// The whole state of your package will be stored and managed here.
const Main = {
    commandListener: null,

    activate (state) {
        this.fileWriter = new FileWriter();
        this.commandListener = new CommandListener(this.fileWriter);
    },
    deactivate () {
        // When the user or Atom itself kills a window, this method is called.
    },
    serialize () {
        // To save the current package's state, this method should return
        // an object containing all required data.
    }
};

export default Main;
