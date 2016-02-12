var expect = require('chai').expect
var messages = require('../lib/messages.js')

describe("messages", function(){
  describe("#build_a_message", function(){
    it("validates that line numbers are added to messages", function(){
      expect(messages.build('latest_tag', 1)).to.have.property('line', 1);
      expect(messages.build('', 1)).to.have.property('line', 1);
    });
  });
});
