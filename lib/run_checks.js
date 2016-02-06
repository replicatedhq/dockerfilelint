
var commands = module.exports = {

  // Given a bash command (command && command && command, etc), return an array
  // of all apt-get full commands found
  aptget_commands: function(args) {
    var aptgetCommands = [];
    var commands = args.split('&&');
    commands.forEach(function(command) {
      command = command.trim();
      // Treat apt-get as a special command and split it apart
      if (command.startsWith('apt-get')) {
        aptgetCommands.push(command);
      }
    });

    return aptgetCommands;
  },

  // return the subcommand from apt-get
  aptget_subcommand: function(aptgetCommand) {
    var commandParts = aptgetCommand.match(/\S+/g);
    if (commandParts.length === 1) {
      return "";
    }

    // Is the subcommand always immediately after apt-get?
    return commandParts[1];
  },

  // check that -y is included on an apt-get command
  aptget_hasyes: function(aptgetCommand) {
    var commandParts = aptgetCommand.match(/\S+/g);
    if (commandParts.length === 1) {
      return "";
    }

    var found = false;
    commandParts.forEach(function(commandPart) {
      if (commandPart.trim().toLowerCase() === "-y") {
        found = true;
      }
    });

    return found;
  },

  // check that an apt-get command has a no-install-recommends flag
  aptget_hasnorecommends: function(aptgetCommand) {
    var commandParts = aptgetCommand.match(/\S+/g);
    if (commandParts.length === 1) {
      return "";
    }

    var found = false;
    commandParts.forEach(function(commandPart) {
      if (commandPart.trim().toLowerCase() === "--no-install-recommends") {
        found = true;
      }
    });

    return found;
  },

  // check that command includes a rm -rf /var/lib/apt/lists/*
  includes_rmaptlists: function(args) {
    var isAllFound = false;
    var commands = args.split('&&');
    commands.forEach(function(command) {
      command = command.trim();
      if (command.startsWith('rm')) {
        var commandParts = command.match(/\S+/g);
        var isCorrectPath = false,
            isCorrectFlags = false;
        commandParts.forEach(function(commandPart) {
          if (commandPart.includes('-') && commandPart.includes('r') && commandPart.includes('f')) {
            isCorrectFlags = true;
          } else if (commandPart === '/var/lib/apt/lists/*') {
            isCorrectPath = true;
          }
        });

        isAllFound = isAllFound || (isCorrectFlags && isCorrectPath);
      }
    });

    return isAllFound;
  }
}
