var command_parser = require('./command_parser');

var commands = module.exports = {
  apk_commands: function(commands) {
    return command_parser.filter_commands(commands, 'apk');
  },

  // return the subcommand from apk
  apk_subcommand: function(apkCommand) {
    return command_parser.get_subcommand(apkCommand);
  },

  // check that an apk add command has --no-cache flag
  apkadd_hasnocache: function(apkaddCommand) {
    return command_parser.command_has_flag(apkaddCommand, '--no-cache');
  },

  // check that an apk add command has --update flag
  apkadd_hasupdate: function(apkaddCommand) {
    return command_parser.command_has_flag(apkaddCommand, '--update');
  },

  // returns the number of packages in the apk add command
  apkadd_numpackages: function(apkaddCommand) {
    var num_packages = 0;
    var parts = apkaddCommand.split(' ');
    if (apkaddCommand.length < 3) {
      return 0;
    }

    parts.splice(0, 2);
    parts.forEach(function(part) {
      part = part.replace(/ /g,'');
      if (part.length > 0 && !part.startsWith('-')) {
        num_packages++;
      }
    });

    return num_packages;
  },

  // check that an apk add command has a --virtual flag
  apkadd_hasvirtual: function(apkaddCommand) {
    return command_parser.command_has_flag(apkaddCommand, '--virtual') || command_parser.command_has_flag(apkaddCommand, '-t');
  },

  // check that command includes a rm -rf /var/cache/apk/*
  follows_rmapkcache: function(commands, index) {
    return command_parser.get_nextcommands(commands, index).some(function(command) {
      if (command.split(' ')[0] !== 'rm') {
        return false;
      }
      if (!command_parser.command_has_part(command, '/var/cache/apk/*')) {
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
