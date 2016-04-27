var expect = require('chai').expect
var messages = require('../lib/messages.js')

describe("messages", function(){
  describe("#ignore_works", function(){
    it("validates that disabled commands are ignored", function(){
      expect(messages.build({latest_tag: 'off'}, 'latest_tag', 1)).to.be.null;
      expect(messages.build({latest_tag: 'TRUE'}, 'latest_tag', 1)).to.have.property('line', 1);
    });
  }),

  describe("#build_a_message", function(){
    it("validates that line numbers are added to messages", function(){
      expect(messages.build({}, 'latest_tag', 1)).to.have.property('line', 1);
      expect(messages.build({}, '', 1)).to.have.property('line', 1);
    });
  });
});
