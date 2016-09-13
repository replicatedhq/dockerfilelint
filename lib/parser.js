// ported from github.com/docker/docker
// https://github.com/docker/docker/blob/e95b6b51daed868094c7b66113381d5088e831b4/builder/dockerfile/parser/line_parsers.go

var parser = module.exports = {
  nameVal: function(rest) {
    var nameVal = {};

    var words = parser.words(rest);
    if (words.length === 0) {
      return nameVal;
    }

    // Old style is currently not supported
    // Old format (KEY name value)
    // if (!words[0].includes('=')) {
    //   var strs = rest.split(/\s+/g);
    //   if (strs.length !== 2) {
    //     throw new Error("must have exactly two arguments");
    //   }
    //   nameVal[strs[0]] = strs[1];
    //   return nameVal;
    // }

    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      if (!word.includes('=')) {
        throw new Error("Syntax error - can't find = in " + word + ". Must be of the form: name=value");
      }
      var parts = word.split('=');
      nameVal[parts.shift()] = parts.join('=');
    }
    return nameVal;
  },

  words: function(rest) {
    var inSpaces = 0, inWord = 1, inQuote = 2;
    var words = [];
    var phase = inSpaces;
    var word = '';
    var quote;
    var blankOK = false;
    var ch;

    for (var pos = 0, len = rest.length; pos <= len; pos++) {
      if (pos !== len) {
        ch = rest[pos];
      }

      if (phase === inSpaces) { // Looking for start of word
        if (pos === len) { // end of input
          break;
        }
        if (/\s/.test(ch)) { // skip spaces
          continue;
        }
        phase = inWord; // found it, fall through
      }
      if ((phase === inWord || phase === inQuote) && (pos === len)) {
        if (blankOK || word.length > 0) {
          words.push(word);
        }
        break;
      }
      if (phase === inWord) {
        if (/\s/.test(ch)) {
          phase = inSpaces;
          if (blankOK || word.length > 0) {
            words.push(word);
          }
          word = '';
          blankOK = false;
          continue;
        }
        if (ch === '\'' || ch === '"') {
          quote = ch;
          blankOK = true;
          phase = inQuote;
        }
        if (ch === '\\') {
          if (pos+1 === len) {
            continue; // just skip an escape token at end of line
          }
          // If we're not quoted and we see an escape token, then always just
          // add the escape token plus the char to the word, even if the char
          // is a quote.
          word += ch;
          pos += 1;
          ch = rest[pos];
        }
        word += ch;
        continue;
      }
      if (phase === inQuote) {
        if (ch === quote) {
          phase = inWord;
        }
        // The escape token is special except for ' quotes - can't escape anything for '
        if (ch === '\\' && quote !== '\'') {
          if (pos+1 === len) {
            phase = inWord;
            continue; // just skip the escape token at end
          }
          pos += 1
          word += ch;
          ch = rest[pos];
        }
        word += ch;
      }
    }

    return words;
  }
};
