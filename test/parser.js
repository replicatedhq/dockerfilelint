var expect = require('chai').expect
var parser = require('../lib/parser.js')

describe('parser', function() {
  describe("#words(rest)", function() {
    it("splits words", function(){
      expect(parser.words("one two")).to.have.length(2)
        .and.to.eql(['one', 'two']);
    });

    it("does not split quotes", function(){
      expect(parser.words("one \"two three\" 'four five'")).to.have.length(3)
        .and.to.eql(['one', "\"two three\"", "'four five'"]);
    });

    it("honor escape characters", function(){
      expect(parser.words("one two\\ thre\\e \"fou\\r\"")).to.have.length(3)
        .and.to.eql(['one', 'two\\ thre\\e', '"fou\\r"']);
    });

    it("ignore escape character at line end", function(){
      expect(parser.words("one two\\")).to.have.length(2)
        .and.to.eql(['one', 'two']);
      expect(parser.words("one \"two\\")).to.have.length(2)
        .and.to.eql(['one', '\"two']);
    });
  });
});
