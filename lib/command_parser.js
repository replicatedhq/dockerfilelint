var parser = require('./parser');

var command_parser = module.exports = {
  // Given a bash command (command && command && command, etc), return an array
  // of all commands
  split_commands: function(args) {
    var commands = [];
    var idx = 0;
    parser.words(args).forEach(function(word) {
      if (['||', '&&', ';;', '|&'].indexOf(word) > -1) {
        idx++;
        return
      }
      if (commands.length < idx+1) {
        commands[idx] = [];
      }
      commands[idx].push(word);
    });
    var c = commands.map(function(command) {
      return command.join(' ');
    });
    return c;
  },

  // return an array of all `prefix` commands found
  filter_commands: function(commands, prefix) {
    var prefixCommands = [];
    if (commands) {
      commands.forEach(function(command) {
        command = command.trim();
        command = command_parser.command_strip_env(command);
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

  command_strip_env: function(command) {
    var result = [];
    var prefix = true;
    parser.words(command).forEach(function(word) {
      if (prefix && word.match(/.*[^\\]=.*/)) {
        return;
      }
      prefix = false;
      result.push(word);
    });
    return result.join(' ');
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
    throw new Error('bad flag');
  },

  get_nextcommands: function(commands, index) {
    return commands.slice(index+1);
  }
};
