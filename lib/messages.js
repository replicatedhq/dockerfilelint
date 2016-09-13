var reference = require('./reference');

var messages = module.exports = {
  parseBool: function(s) {
    s = s.toLowerCase();
    if (s === 'off' || s === 'false' || s === '0' || s === 'n') {
      return false;
    }

    return true;
  },

  build: function(rules, name, line) {
    if (name in rules) {
      if (!messages.parseBool(rules[name])) {
        return null;
      }
    }
    var message = {};
    if (name in reference) {
      Object.assign(message, reference[name]);
    } else {
      message.title = name;
      message.description = 'No description for message';
    }

    message.line = line;
    message.rule = name;
    return message;
  }
};
