
var reference = require('./reference');

var messages = module.exports = {
  build: function(ignored, name, line) {
    if (ignored) {
      if (ignored.indexOf(name) !== -1) {
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
    return message;
  },
};
