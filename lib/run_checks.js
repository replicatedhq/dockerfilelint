
// return an array of all `prefix` commands found
var filter_commands = function(commands, prefix) {
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
};

var get_subcommand = function(command) {
  var subcommand = '';
  command.match(/\S+/g).slice(1).some(function(part) {
    if (!part.startsWith('-')) {
      subcommand = part;
      return true;
    }
  });
  return subcommand;
};

var command_has_part = function(command, commandPart) {
  return command.match(/\S+/g).some(function(part) {
    return part.trim() === commandPart;
  });
};

var command_has_flag = function(command, commandFlag) {
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
};

var get_nextcommands = function(commands, index) {
  return commands.slice(index+1);
};

var commands = module.exports = {
  // Given a bash command (command && command && command, etc), return an array
  // of all commands
  split_commands: function(args) {
    return args.split('&&').map(function(command) {
      return command.trim();
    });
  },

  aptget_commands: function(commands) {
    return filter_commands(commands, 'apt-get');
  },

  // return the subcommand from apt-get
  aptget_subcommand: function(aptgetCommand) {
    return get_subcommand(aptgetCommand);
  },

  // check that -y is included on an apt-get command
  aptget_hasyes: function(aptgetCommand) {
    return command_has_flag(aptgetCommand, '-y')
     || command_has_flag(aptgetCommand, '--yes')
     || command_has_flag(aptgetCommand, '--assume-yes');
  },

  // check that an apt-get command has a no-install-recommends flag
  aptget_hasnorecommends: function(aptgetCommand) {
    return command_has_flag(aptgetCommand, '--no-install-recommends');
  },

  // check that command includes a rm -rf /var/lib/apt/lists/*
  follows_rmaptlists: function(commands, index) {
    return get_nextcommands(commands, index).some(function(command) {
      if (command.split(' ')[0] !== 'rm') {
        return false;
      }
      if (!command_has_part(command, '/var/lib/apt/lists/*')) {
        return false;
      }
      if (!command_has_flag(command, '-r')
        && !command_has_flag(command, '-R')
        && !command_has_flag(command, '--recursive')) {
        return false;
      }
      if (!command_has_flag(command, '-f')
        && !command_has_flag(command, '--force')) {
        return false;
      }
      return true;
    });
  },

  apk_commands: function(commands) {
    return filter_commands(commands, 'apk');
  },

  // return the subcommand from apk
  apk_subcommand: function(apkCommand) {
    return get_subcommand(apkCommand);
  },

  // check that an apk add command has --no-cache flag
  apkadd_hasnocache: function(apkaddCommand) {
    return command_has_flag(apkaddCommand, '--no-cache');
  },

  // check that an apk add command has --update flag
  apkadd_hasupdate: function(apkaddCommand) {
    return command_has_flag(apkaddCommand, '--update');
  },

  // check that command includes a rm -rf /var/cache/apk/*
  follows_rmapkcache: function(commands, index) {
    return get_nextcommands(commands, index).some(function(command) {
      if (command.split(' ')[0] !== 'rm') {
        return false;
      }
      if (!command_has_part(command, '/var/cache/apk/*')) {
        return false;
      }
      if (!command_has_flag(command, '-r')
        && !command_has_flag(command, '-R')
        && !command_has_flag(command, '--recursive')) {
        return false;
      }
      if (!command_has_flag(command, '-f')
        && !command_has_flag(command, '--force')) {
        return false;
      }
      return true;
    });
  }
};
