var expect = require('chai').expect
var apk = require('../lib/apk.js')

describe("apk", function(){
  describe("#apk_commands(commands)", function(){
    it("extracts apk commands from longer bash command", function(){
      expect(apk.apk_commands(["apk add python-pip"])).to.have.length(1);
      expect(apk.apk_commands(["# apk add python-pip"])).to.have.length(0);
      expect(apk.apk_commands(["echo test", "apk add python-pip"])).to.have.length(1);
      expect(apk.apk_commands(["apk add python-pip", "apk remove python-pip"])).to.have.length(2);
    });
  });

  describe("#apk_subcommand(command)", function(){
    it("retrieves the subcommand passed to apk", function(){
      expect(apk.apk_subcommand("apk --no-cache add python-pip")).to.equal('add');
      expect(apk.apk_subcommand("apk remove python-pip")).to.equal('remove');
    });
  });

  describe("#apkadd_hasnocache(command)", function(){
    it("validates that --no-cache flag is present on apk add commands", function(){
      expect(apk.apkadd_hasnocache("apk --no-cache add python-pip")).to.equal(true);
      expect(apk.apkadd_hasnocache("apk --update add python-pip")).to.equal(false);
    });
  });

  describe("#apkadd_numpackages(command)", function(){
    it("validates that the num packages are counted correctly", function(){
      expect(apk.apkadd_numpackages("apk add one")).to.equal(1);
      expect(apk.apkadd_numpackages("")).to.equal(0);
      expect(apk.apkadd_numpackages("apk add one two")).to.equal(2);
    });
  });

  describe("#apkadd_hasupdate(command)", function(){
    it("validates that --no-cache flag is present on apk add commands", function(){
      expect(apk.apkadd_hasupdate("apk --no-cache add python-pip")).to.equal(false);
      expect(apk.apkadd_hasupdate("apk --update add python-pip")).to.equal(true);
    });
  });

  describe("#follows_rmapkcache(command)", function(){
    it("validates that a matching rm command is present on apk add commands", function(){
      expect(apk.follows_rmapkcache(["apk add --update python-pip"], 0)).to.equal(false);
      expect(apk.follows_rmapkcache(["apk add --update python-pip", "rm -rf /var/cache/apk"], 0)).to.equal(false);
      expect(apk.follows_rmapkcache(["apk add --update python-pip", "rmrf -rf /var/cache/apk/*"], 0)).to.equal(false);
      expect(apk.follows_rmapkcache(["apk add --update python-pip", "rm -rf /var/cache/apk/*"], 1)).to.equal(false);
      expect(apk.follows_rmapkcache(["apk add --update python-pip", "rm --force /var/cache/apk/*"], 0)).to.equal(false);
      expect(apk.follows_rmapkcache(["apk add --update python-pip", "rm -r /var/cache/apk/*"], 0)).to.equal(false);
      expect(apk.follows_rmapkcache(["apk add --update python-pip", "rm -rfv /var/cache/apk/*"], 0)).to.equal(true);
      expect(apk.follows_rmapkcache(["apk add --update python-pip", "rm -fR /var/cache/apk/*"], 0)).to.equal(true);
      expect(apk.follows_rmapkcache(["apk add --update python-pip", "rm --force -r /var/cache/apk/*"], 0)).to.equal(true);
      expect(apk.follows_rmapkcache(["apk add --update python-pip", "rm --force --recursive /var/cache/apk/*"], 0)).to.equal(true);
    });
  });
});
