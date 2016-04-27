
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
      if (!this.parseBool(rules[name])) {
        return null;
      }
    }
    var message = reference[name];
    if (!message) {
      message = {
        title: name,
        description: 'No description for message'
      };
    }

    message.line = line;
    message.rule = name;
    return message;
  },
};
