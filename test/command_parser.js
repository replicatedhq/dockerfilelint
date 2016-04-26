var expect = require('chai').expect
var command_parser = require('../lib/command_parser.js')

describe("command_parser", function(){
  describe("#split_commands(args)", function(){
    it("splits commands separated by && into individual commands", function(){
      expect(command_parser.split_commands("apt-get install -y python-pip")).to.have.length(1);
      expect(command_parser.split_commands("apt-get install -y python-pip && apt-get remove -y python-pip")).to.have.length(2);
    });
  });
});
