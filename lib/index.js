'use strict';

var path = require('path');
var fs = require('fs');
var yaml = require('js-yaml');
var checks = require('./checks');
var command_parser = require('./command_parser');
var apk = require('./apk');
var apt = require('./apt');
var messages = require('./messages');

module.exports.run = function(configPath, content) {
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
    stages: [{
      instructionsProcessed: 0,
      cmdFound: false // this doesn't seem to be used anywhere
    }],
    items: [],
    rules: loadRules(configPath)
  }

  for (var idx in instructions) {
    var result = runLine(state, instructions, idx);
    state.items = state.items.concat(result.items);

    // We care about only having 1 cmd instruction
    if (result.command === 'cmd') {
      state.stages[state.stages.length - 1].cmdFound = true;
    } else if (result.command === 'from' && state.stages[state.stages.length - 1].instructionsProcessed !== 0) {
      // Each FROM command constitutes a new stage in a multistage build
      state.stages.push({
        instructionsProcessed: 0,
        cmdFound: false
      });
    }

    // And we also care about knowing if this is the first command or not
    state.stages[state.stages.length - 1].instructionsProcessed++;
  };

  return state.items;
}

function loadRules(configPath) {
  // Find any .dockerfilelintrc
  var configFileContents = tryLoadFile(path.join(configPath, '.dockerfilelintrc'))
  if (!configFileContents) {
    return {};
  }

  var rc = yaml.safeLoad(configFileContents);
  return rc.rules;
}

function tryLoadFile(filename) {
  try {
    var stats = fs.lstatSync(filename);
    if (stats.isFile()) {
      return fs.readFileSync(filename, 'UTF-8');
    }
    return null;
  } catch (e) {
    return null;
  }
}

function runLine(state, instructions, idx) {
  // return items in an object with the line number as key, value is array of items for this line
  var items = [];
  var line = parseInt(idx) + 1;

  // All Dockerfile commands require parameters, this is an error if not
  var instruction = instructions[idx];
  if (instruction.trim().match(/\S+/g).length === 1) {
    items.push(messages.build(state.rules, 'required_params', line));
  }

  // get the command from this instruction
	var cmd = instruction.trim().match(/\S+/g)[0].toLowerCase();

  // cmd should be upper case (style)
  if (instruction.trim().match(/\S+/g)[0] !== cmd.toUpperCase()) {
    items.push(messages.build(state.rules, 'uppercase_commands', line));
  }

  // check that the first command is a FROM, this might get reported twice, if the FROM command does exist,
  // but is not the time (non blank, non commented) line
  if (state.stages[state.stages.length - 1].instructionsProcessed === 0 && cmd !== 'from') {
    items.push(messages.build(state.rules, 'from_first', line));
  }

  // Without the command instruction itself, get the args (trimmed)
  var args = instruction.toLowerCase().replace(cmd, '').trim();

  if (!args) {
    items.push(messages.build(state.rules, 'invalid_line', line));
  }

  // check for sudo usage in any command
  if (args) {
    args.match(/\S+/g).forEach(function(arg) {
      if (arg.trim().toLowerCase() === 'sudo') {
        items.push(messages.build(state.rules, 'sudo_usage', line));
      }
    }.bind(this));

    // Vaildate each command individually
    switch (cmd) {
      case 'from':
        checks.base_image_tag(args).forEach(function(item) {
          items.push(messages.build(state.rules, item, line));
        });
        break;
      case 'maintainer':
        checks.valid_maintainer(args).forEach(function(item) {
          items.push(messages.build(state.rules, item, line));
        });
        break;
      case 'run':
        var aptgetSubcommands = [];
        var commands = command_parser.split_commands(args);

        // parse apt commands
        apt.aptget_commands(commands).forEach(function(aptget_command, index) {
          var subcommand = apt.aptget_subcommand(aptget_command);
          aptgetSubcommands.push(subcommand);
          if (["install", "remove", "upgrade"].indexOf(subcommand) > -1) {
            if (!apt.aptget_hasyes(aptget_command)) {
              items.push(messages.build(state.rules, 'apt-get_missing_param', line));
            }
          }

          if (subcommand === 'install') {
            if (!apt.aptget_hasnorecommends(aptget_command)) {
              items.push(messages.build(state.rules, 'apt-get_recommends', line));
            }
          } else if (subcommand === 'update') {
            if (!apt.follows_rmaptlists(commands, index)) {
              items.push(messages.build(state.rules, 'apt-get_missing_rm', line));
            }
          } else if (subcommand === 'upgrade') {
            items.push(messages.build(state.rules, 'apt-get-upgrade', line));
          } else if (subcommand === 'dist-upgrade') {
            items.push(messages.build(state.rules, 'apt-get-dist-upgrade', line));
          }
        });
        if (aptgetSubcommands.indexOf('update') > -1 && aptgetSubcommands.indexOf('install') === -1) {
          items.push(messages.build(state.rules, 'apt-get-update_require_install', line));
        }

        // parse apk commands
        var num_apkdel = 0;
        apk.apk_commands(commands).forEach(function(apk_command) {
          var subcommand = apk.apk_subcommand(apk_command);
          if (subcommand === 'del') {
            num_apkdel++;
          }
        });
        apk.apk_commands(commands).forEach(function(apk_command, index) {
          var subcommand = apk.apk_subcommand(apk_command);
          if (subcommand === 'add') {
            // If there is more than 1 package we are adding and we are also del'ing, we should suggest --virtual
            if (apk.apkadd_numpackages(apk_command) > 1) {
              if (num_apkdel > 0) {
                if (!apk.apkadd_hasvirtual(apk_command)) {
                  items.push(messages.build(state.rules, 'apkadd-missing-virtual', line));
                }
              }
            }
            if (!apk.apkadd_hasnocache(apk_command)) {
              if (!apk.apkadd_hasupdate(apk_command) || !apk.follows_rmapkcache(commands, index)) {
                items.push(messages.build(state.rules, 'apkadd-missing_nocache_or_updaterm', line));
              }
            }
          }
        });
        break;
      case 'cmd':
        break;
      case 'label':
        checks.label_format(args).forEach(function(item) {
          items.push(messages.build(state.rules, item, line));
        });
        break;
      case 'expose':
        checks.expose_container_port_only(args).forEach(function(item) {
          items.push(messages.build(state.rules, item, line));
        });
        args.match(/\S+/g).forEach(function(port) {
          if (!checks.expose_port_valid(port)) {
            if (!port.includes(':')) { // Just eliminate a double message here
              items.push(messages.build(state.rules, 'invalid_port', line));
            }
          }
        });
        break;
      case 'env':
        checks.is_valid_env(args).forEach(function(item) {
          items.push(messages.build(state.rules, item, line));
        });
        break;
      case 'add':
        checks.is_valid_add(args).forEach(function(item) {
          items.push(messages.build(state.rules, item, line));
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
          items.push(messages.build(state.rules, item, line));
        });
        break;
      case 'workdir':
        checks.is_valid_workdir(args).forEach(function(item) {
          items.push(messages.build(state.rules, item, line));
        });
        break;
      case 'arg':
        break;
      case 'onbuild':
        break;
      case 'stopsignal':
        break;
      case 'shell':
        checks.is_valid_shell(args).forEach(function(item) {
          items.push(messages.build(state.rules, item, line));
        });
        break;
      default:
         items.push(messages.build(state.rules, 'invalid_command', line));
         break;
     }
  }

  // Remove any null items from the result
  items = items.filter(function(n){ return n != null });

  return {
    command: cmd,
    items: items
  };
}
