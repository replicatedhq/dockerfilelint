
var reference = require('./reference');

var messages = module.exports = {
  build: function(name, line) {
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
