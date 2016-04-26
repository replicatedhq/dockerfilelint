
var command_parser = module.exports = {
  // Given a bash command (command && command && command, etc), return an array
  // of all commands
  split_commands: function(args) {
    return args.split('&&').map(function(command) {
      return command.trim();
    });
  },

  // return an array of all `prefix` commands found
  filter_commands: function(commands, prefix) {
    var prefixCommands = [];
    if (commands) {
      commands.forEach(function(command) {
        command = command.trim();
        if (command.startsWith(prefix)) {
          prefixCommands.push(command);
        }
      });
    }
    return prefixCommands;
  },

  get_subcommand: function(command) {
    var subcommand = '';
    command.match(/\S+/g).slice(1).some(function(part) {
      if (!part.startsWith('-')) {
        subcommand = part;
        return true;
      }
    });
    return subcommand;
  },

  command_has_part: function(command, commandPart) {
    return command.match(/\S+/g).some(function(part) {
      return part.trim() === commandPart;
    });
  },

  command_has_flag: function(command, commandFlag) {
    if (commandFlag.startsWith('--')) {
      return command.match(/\S+/g).some(function(part) {
        return part.trim() === commandFlag;
      });
    } else if (commandFlag.startsWith('-')) {
      return command.match(/\S+/g).some(function(part) {
        if (part.startsWith('--') || !part.startsWith('-')) {
          return false;
        }
        return part.trim().substr(1).split('').some(function(char) {
          return char === commandFlag.substr(1);
        });
      });
    }
    throw 'bad flag';
  },

  get_nextcommands: function(commands, index) {
    return commands.slice(index+1);
  }
};
