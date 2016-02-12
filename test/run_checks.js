var expect = require('chai').expect
var run_checks = require('../lib/run_checks.js')

describe("run_checks", function(){
  describe("#split_commands(args)", function(){
    it("splits commands separated by && into individual commands", function(){
      expect(run_checks.split_commands("apt-get install -y python-pip")).to.have.length(1);
      expect(run_checks.split_commands("apt-get install -y python-pip && apt-get remove -y python-pip")).to.have.length(2);
    });
  });

  describe("#aptget_commands(commands)", function(){
    it("extracts apt-get commands from longer bash command", function(){
      expect(run_checks.aptget_commands(["apt-get install -y python-pip"])).to.have.length(1);
      expect(run_checks.aptget_commands(["# apt-get install -y python-pip"])).to.have.length(0);
      expect(run_checks.aptget_commands(["echo test", "apt-get install -y python-pip"])).to.have.length(1);
      expect(run_checks.aptget_commands(["apt-get install -y python-pip", "apt-get remove -y python-pip"])).to.have.length(2);
    });
  });

  describe("#aptget_subcommand(command)", function(){
    it("retrieves the subcommand passed to apt-get", function(){
      expect(run_checks.aptget_subcommand("apt-get install -y python-pip")).to.equal('install');
      expect(run_checks.aptget_subcommand("apt-get remove -y python-pip")).to.equal('remove');
    });
  });

  describe("#aptget_hasyes(command)", function(){
    it("validates that -y flag is present on apt-get (update|install|remove) commands", function(){
      expect(run_checks.aptget_hasyes("apt-get install -y python-pip")).to.equal(true);
      expect(run_checks.aptget_hasyes("apt-get install --yes python-pip")).to.equal(true);
      expect(run_checks.aptget_hasyes("apt-get install --assume-yes python-pip")).to.equal(true);
      expect(run_checks.aptget_hasyes("apt-get install python-pip")).to.equal(false);
    });
  });

  describe("#aptget_hasnorecommends(command)", function(){
    it("validates that --no-recommends flag is present on apt-get install commands", function(){
      expect(run_checks.aptget_hasnorecommends("apt-get install -y --no-install-recommends python-pip")).to.equal(true);
      expect(run_checks.aptget_hasnorecommends("apt-get install -y python-pip")).to.equal(false);
    });
  });

  describe("#follows_rmaptlists(command)", function(){
    it("validates that a matching rm command is present on apt-get install commands", function(){
      expect(run_checks.follows_rmaptlists(["apt-get install -y --no--install-recommends python-pip"], 0)).to.equal(false);
      expect(run_checks.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rm -rf /var/lib/apt/lists/*"], 1)).to.equal(false);
      expect(run_checks.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rmrf -rf /var/lib/apt/lists/*"], 0)).to.equal(false);
      expect(run_checks.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rm -rf /var/lib/apt/lists"], 0)).to.equal(false);
      expect(run_checks.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rm --force /var/lib/apt/lists/*"], 0)).to.equal(false);
      expect(run_checks.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rm -r /var/lib/apt/lists/*"], 0)).to.equal(false);
      expect(run_checks.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rm -rfv /var/lib/apt/lists/*"], 0)).to.equal(true);
      expect(run_checks.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rm -fR /var/lib/apt/lists/*"], 0)).to.equal(true);
      expect(run_checks.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rm --force -r /var/lib/apt/lists/*"], 0)).to.equal(true);
      expect(run_checks.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rm --force --recursive /var/lib/apt/lists/*"], 0)).to.equal(true);
    });
  });

  describe("#apk_commands(commands)", function(){
    it("extracts apk commands from longer bash command", function(){
      expect(run_checks.apk_commands(["apk add python-pip"])).to.have.length(1);
      expect(run_checks.apk_commands(["# apk add python-pip"])).to.have.length(0);
      expect(run_checks.apk_commands(["echo test", "apk add python-pip"])).to.have.length(1);
      expect(run_checks.apk_commands(["apk add python-pip", "apk remove python-pip"])).to.have.length(2);
    });
  });

  describe("#apk_subcommand(command)", function(){
    it("retrieves the subcommand passed to apk", function(){
      expect(run_checks.apk_subcommand("apk --no-cache add python-pip")).to.equal('add');
      expect(run_checks.apk_subcommand("apk remove python-pip")).to.equal('remove');
    });
  });

  describe("#apkadd_hasnocache(command)", function(){
    it("validates that --no-cache flag is present on apk add commands", function(){
      expect(run_checks.apkadd_hasnocache("apk --no-cache add python-pip")).to.equal(true);
      expect(run_checks.apkadd_hasnocache("apk --update add python-pip")).to.equal(false);
    });
  });

  describe("#apkadd_hasupdate(command)", function(){
    it("validates that --no-cache flag is present on apk add commands", function(){
      expect(run_checks.apkadd_hasupdate("apk --no-cache add python-pip")).to.equal(false);
      expect(run_checks.apkadd_hasupdate("apk --update add python-pip")).to.equal(true);
    });
  });

  describe("#follows_rmapkcache(command)", function(){
    it("validates that a matching rm command is present on apk add commands", function(){
      expect(run_checks.follows_rmapkcache(["apk add --update python-pip"], 0)).to.equal(false);
      expect(run_checks.follows_rmapkcache(["apk add --update python-pip", "rm -rf /var/cache/apk"], 0)).to.equal(false);
      expect(run_checks.follows_rmapkcache(["apk add --update python-pip", "rmrf -rf /var/cache/apk/*"], 0)).to.equal(false);
      expect(run_checks.follows_rmapkcache(["apk add --update python-pip", "rm -rf /var/cache/apk/*"], 1)).to.equal(false);
      expect(run_checks.follows_rmapkcache(["apk add --update python-pip", "rm --force /var/cache/apk/*"], 0)).to.equal(false);
      expect(run_checks.follows_rmapkcache(["apk add --update python-pip", "rm -r /var/cache/apk/*"], 0)).to.equal(false);
      expect(run_checks.follows_rmapkcache(["apk add --update python-pip", "rm -rfv /var/cache/apk/*"], 0)).to.equal(true);
      expect(run_checks.follows_rmapkcache(["apk add --update python-pip", "rm -fR /var/cache/apk/*"], 0)).to.equal(true);
      expect(run_checks.follows_rmapkcache(["apk add --update python-pip", "rm --force -r /var/cache/apk/*"], 0)).to.equal(true);
      expect(run_checks.follows_rmapkcache(["apk add --update python-pip", "rm --force --recursive /var/cache/apk/*"], 0)).to.equal(true);
    });
  });
});
