var command_parser = require('./command_parser');

var apt = module.exports = {
  aptget_commands: function(commands) {
    return command_parser.filter_commands(commands, 'apt-get');
  },

  // return the subcommand from apt-get
  aptget_subcommand: function(aptgetCommand) {
    return command_parser.get_subcommand(aptgetCommand);
  },

  // check that -y is included on an apt-get command
  aptget_hasyes: function(aptgetCommand) {
    return command_parser.command_has_flag(aptgetCommand, '-y')
     || command_parser.command_has_flag(aptgetCommand, '--yes')
     || command_parser.command_has_flag(aptgetCommand, '--assume-yes');
  },

  // check that an apt-get command has a no-install-recommends flag
  aptget_hasnorecommends: function(aptgetCommand) {
    return command_parser.command_has_flag(aptgetCommand, '--no-install-recommends');
  },

  // check that command includes a rm -rf /var/lib/apt/lists/*
  follows_rmaptlists: function(commands, index) {
    return command_parser.get_nextcommands(commands, index).some(function(command) {
      if (command.split(' ')[0] !== 'rm') {
        return false;
      }
      if (!command_parser.command_has_part(command, '/var/lib/apt/lists/*')) {
        return false;
      }
      if (!command_parser.command_has_flag(command, '-r')
        && !command_parser.command_has_flag(command, '-R')
        && !command_parser.command_has_flag(command, '--recursive')) {
        return false;
      }
      if (!command_parser.command_has_flag(command, '-f')
        && !command_parser.command_has_flag(command, '--force')) {
        return false;
      }
      return true;
    });
  }
};
