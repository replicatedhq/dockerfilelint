'use strict';

var checks = require('./checks');
var run_checks = require('./run_checks');

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
    messages: []
  }

  for (var idx in instructions) {
    var result = runLine(state, instructions, idx);
    state.messages = state.messages.concat(result.messages);

    // We care about only having 1 cmd instruction
    if (result.command === 'cmd') {
      state.cmdFound = true;
    }

    // And we also care about knowing if this is the first command or not
    state.instructionsProcessed = state.instructionsProcessed + 1;
  };

  return state.messages;
}

function runLine(state, instructions, idx) {
  // return messages in an object with the line number as key, value is array of messages for this line
  var messages = [];

  // All Dockerfile commands require parameters, this is an error if not
  var instruction = instructions[idx];
  if (instruction.trim().match(/\S+/g).length === 1) {
    messages.push({line: parseInt(idx)+1, name: 'required_params', message: 'Command \'' + instruction + '\' without parameters'});
  }

  // get the command from this instruction
	var cmd = instruction.trim().match(/\S+/g)[0].toLowerCase();

  // cmd should be upper case (style)
  if (instruction.trim().match(/\S+/g)[0] !== cmd.toUpperCase()) {
    messages.push({line: parseInt(idx)+1, name: 'uppercase_commands', message: 'Command \'' + instruction.trim().match(/\S+/g)[0] + '\' should be upper case'});
  }

  // check that the first command is a FROM, this might get reported twice, if the FROM command does exist,
  // but is not the time (non blank, non commented) line
  if ((state.instructionsProcessed === 0 && cmd !== 'from') || (state.instructionsProcessed !== 0 && cmd === 'from')) {
    messages.push({line: parseInt(idx)+1, name: 'from_first', message: 'FROM command should be the first line in a Dockerfile.'});
  }

  // Without the command instruction itself, get the args (trimmed)
  var args = instruction.toLowerCase().replace(cmd, '').trim();

  if (!args) {
    messages.push({line: parseInt(idx)+1, name: 'invalid_line', message: 'Line is invalid'});
  }

  // check for sudo usage in any command
  if (args) {
    args.match(/\S+/g).forEach(function(arg) {
      if (arg.trim().toLowerCase() === 'sudo') {
        messages.push({line: parseInt(idx)+1, name: 'sudo_usage', message: 'sudo usage is not allowed.  Commands will run as sudo.'});
      }
    }.bind(this));
  }

  // Vaildate each command individually
  switch (cmd) {
    case 'from':
      checks.base_image_tag(args).forEach(function(message) {
        messages.push({line: parseInt(idx)+1, name: message.name, message: message.message});
      });
      break;
    case 'maintainer':
      checks.valid_maintainer(args).forEach(function(message) {
        messages.push({line: parseInt(idx)+1, name: message.name, message: message.message});
      });
      break;
    case 'run':
      var subcommands = [];
      run_checks.aptget_commands(args).forEach(function(aptget_command) {
        var subcommand = run_checks.aptget_subcommand(aptget_command);
        subcommands.push(subcommand);
        if (["install", "remove", "upgrade"].indexOf(subcommand) > -1) {
          if (!run_checks.aptget_hasyes(aptget_command)) {
            messages.push({line: parseInt(idx)+1, name: 'apt-get_missing_param', message: 'apt-get commands should include a -y flag'});
          }
        }

        if (subcommand === 'install') {
          if (!run_checks.aptget_hasnorecommends(aptget_command)) {
            messages.push({line: parseInt(idx)+1, name: 'apt-get_recommends', message: 'apt-get install commands should include a --no-install-recommends flag'});
          }
        } else if (subcommand === 'upgrade') {
          messages.push({line: parseInt(idx)+1, name: 'apt-get-upgrade', message: 'apt-get upgrade is not allowed'});
        } else if (subcommand === 'dist-upgrade') {
          messages.push({line: parseInt(idx)+1, name: 'apt-get-dist-upgrade', message: 'apt-get dist-upgrade is not allowed'});
        }
      });
      if ((subcommands.indexOf('update') > -1) && (subcommands.indexOf('install') === -1)) {
        messages.push({line: parseInt(idx)+1, name: 'apt-get-update_require_install', message: 'apt-get update commands must be paired with apt-get install commands'});
      }
      break;
    case 'cmd':
      break;
    case 'label':
      checks.label_format(args).forEach(function(message) {
        messages.push({line: parseInt(idx)+1, name: message.name, message: message.message});
      });
      break;
    case 'expose':
      checks.expose_container_port_only(args).forEach(function(message) {
        messages.push({line: parseInt(idx)+1, name: message.name, message: message.message});
      });
      args.match(/\S+/g).forEach(function(port) {
        if (!checks.expose_port_valid(port)) {
          if (!port.includes(':')) { // Just eliminate a double message here
            messages.push({line: parseInt(idx)+1, name: 'invalid_port', message: 'EXPOSE should be a valid port number'});
          }
        }
      });
      break;
    case 'env':
      checks.is_valid_env(args).forEach(function(message) {
        messages.push({line: parseInt(idx)+1, name: message.name, message: message.message});
      });
      break;
    case 'add':
      checks.is_valid_add(args).forEach(function(message) {
        messages.push({line: parseInt(idx)+1, name: message.name, message: message.message});
      });
      break;
    case 'copy':
      break;
    case 'entrypoint':
      break;
    case 'volume':
      break;
    case 'user':
      checks.valid_user(args).forEach(function(message) {
        messages.push({line: parseInt(idx)+1, name: message.name, message: message.message});
      });
      break;
    case 'workdir':
      checks.is_valid_workdir(args).forEach(function(message) {
        messages.push({line: parseInt(idx)+1, name: message.name, message: message.message});
      });
      break;
    case 'arg':
      break;
    case 'onbuild':
      break;
    case 'stopsignal':
      break;
    default:
       messages.push({line: parseInt(idx)+1, name: 'invalid_command', message: 'Only supported Dockerfile commands are allowed'});
       break;
  }

  return {
    command: cmd,
    messages: messages
  };
}
