'use strict';

var checks = require('./checks');
var run_checks = require('./run_checks');
var messages = require('./messages');

module.exports.run = function(content) {
  // Parse the file into an array of instructions
  var instructions = {};
  var lines = content.split(/\r?\n/) || [];

  // Supporting multi-line commands, read each line into an array of "instructions", noting the
  // original line number the instruction started on
  var partialLine = '';
  var partialLineNum = 0;
  lines.forEach(function(line, lineNum) {
    // Trim whitespace from the line
    line = line.trim();

    // Ignore empty lines and comments
    if (line === '' || line.startsWith('#')) {
      return;
    }

    // If the line ends in \, then it's a partial line
    if (line.slice(-1) === '\\') {
      partialLine = partialLine + line.slice(0, -1) + ' ';
      if (partialLineNum === 0) {
        partialLineNum = lineNum;
      }
      return;
    }

    // We want the errors to report the correct line number, so get the start of the
    // extended, multi-line instruction
    if (partialLineNum !== 0) {
      lineNum = partialLineNum;
    }

    // Append to any partial line, clearing the partial line for the next cycle
    var entireLine = partialLine + ' ' + line;
    instructions[lineNum] = entireLine.trim();
    partialLine = '';
    partialLineNum = 0;
  });

  var state = {
    instructionsProcessed: 0,
    cmdFound: false,
    items: []
  }

  for (var idx in instructions) {
    var result = runLine(state, instructions, idx);
    state.items = state.items.concat(result.items);

    // We care about only having 1 cmd instruction
    if (result.command === 'cmd') {
      state.cmdFound = true;
    }

    // And we also care about knowing if this is the first command or not
    state.instructionsProcessed = state.instructionsProcessed + 1;
  };

  return state.items;
}

function runLine(state, instructions, idx) {
  // return items in an object with the line number as key, value is array of items for this line
  var items = [];
  var line = parseInt(idx) + 1;

  // All Dockerfile commands require parameters, this is an error if not
  var instruction = instructions[idx];
  if (instruction.trim().match(/\S+/g).length === 1) {
    items.push(messages.build('required_params', line));
  }

  // get the command from this instruction
	var cmd = instruction.trim().match(/\S+/g)[0].toLowerCase();

  // cmd should be upper case (style)
  if (instruction.trim().match(/\S+/g)[0] !== cmd.toUpperCase()) {
    items.push(messages.build('uppercase_commands', line));
  }

  // check that the first command is a FROM, this might get reported twice, if the FROM command does exist,
  // but is not the time (non blank, non commented) line
  if ((state.instructionsProcessed === 0 && cmd !== 'from') || (state.instructionsProcessed !== 0 && cmd === 'from')) {
    items.push(messages.build('from_first', line));
  }

  // Without the command instruction itself, get the args (trimmed)
  var args = instruction.toLowerCase().replace(cmd, '').trim();

  if (!args) {
    items.push(messages.build('invalid_line', line));
  }

  // check for sudo usage in any command
  if (args) {
    args.match(/\S+/g).forEach(function(arg) {
      if (arg.trim().toLowerCase() === 'sudo') {
        items.push(messages.build('sudo_usage', line));
      }
    }.bind(this));

    // Vaildate each command individually
    switch (cmd) {
      case 'from':
        checks.base_image_tag(args).forEach(function(item) {
          items.push(messages.build(item, line));
        });
        break;
      case 'maintainer':
        checks.valid_maintainer(args).forEach(function(item) {
          items.push(messages.build(item, line));
        });
        break;
      case 'run':
        var aptgetSubcommands = [];
        var commands = run_checks.split_commands(args);
        run_checks.aptget_commands(commands).forEach(function(aptget_command, index) {
          var subcommand = run_checks.aptget_subcommand(aptget_command);
          aptgetSubcommands.push(subcommand);
          if (["install", "remove", "upgrade"].indexOf(subcommand) > -1) {
            if (!run_checks.aptget_hasyes(aptget_command)) {
              items.push(messages.build('apt-get_missing_param', line));
            }
          }

          if (subcommand === 'install') {
            if (!run_checks.aptget_hasnorecommends(aptget_command)) {
              items.push(messages.build('apt-get_recommends', line));
            }
          } else if (subcommand === 'update') {
            if (!run_checks.follows_rmaptlists(commands, index)) {
              items.push(messages.build('apt-get_missing_rm', line));
            }
          } else if (subcommand === 'upgrade') {
            items.push(messages.build('apt-get-upgrade', line));
          } else if (subcommand === 'dist-upgrade') {
            items.push(messages.build('apt-get-dist-upgrade', line));
          }
        });
        if (aptgetSubcommands.indexOf('update') > -1 && aptgetSubcommands.indexOf('install') === -1) {
          items.push(messages.build('apt-get-update_require_install', line));
        }
        run_checks.apk_commands(commands).forEach(function(apk_command, index) {
          var subcommand = run_checks.apk_subcommand(apk_command);
          if (subcommand === 'add') {
            if (!run_checks.apkadd_hasnocache(apk_command)) {
              if (!run_checks.apkadd_hasupdate(apk_command) || !run_checks.follows_rmapkcache(commands, index)) {
                items.push(messages.build('apkadd-missing_nocache_or_updaterm', line));
              }
            }
          }
        });
        break;
      case 'cmd':
        break;
      case 'label':
        checks.label_format(args).forEach(function(item) {
          items.push(messages.build(item, line));
        });
        break;
      case 'expose':
        checks.expose_container_port_only(args).forEach(function(item) {
          items.push(messages.build(item, line));
        });
        args.match(/\S+/g).forEach(function(port) {
          if (!checks.expose_port_valid(port)) {
            if (!port.includes(':')) { // Just eliminate a double message here
              items.push(messages.build('invalid_port', line));
            }
          }
        });
        break;
      case 'env':
        checks.is_valid_env(args).forEach(function(item) {
          items.push(messages.build(item, line));
        });
        break;
      case 'add':
        checks.is_valid_add(args).forEach(function(item) {
          items.push(messages.build(item, line));
        });
        break;
      case 'copy':
        break;
      case 'entrypoint':
        break;
      case 'volume':
        break;
      case 'user':
        checks.valid_user(args).forEach(function(item) {
          items.push(messages.build(item, line));
        });
        break;
      case 'workdir':
        checks.is_valid_workdir(args).forEach(function(item) {
          items.push(messages.build(item, line));
        });
        break;
      case 'arg':
        break;
      case 'onbuild':
        break;
      case 'stopsignal':
        break;
      default:
         items.push(messages.build('invalid_command', line));
         break;
     }
  }

  return {
    command: cmd,
    items: items
  };
}
