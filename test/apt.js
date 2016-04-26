var expect = require('chai').expect
var apt = require('../lib/apt.js')

describe("apt", function(){
  describe("#aptget_commands(commands)", function(){
    it("extracts apt-get commands from longer bash command", function(){
      expect(apt.aptget_commands(["apt-get install -y python-pip"])).to.have.length(1);
      expect(apt.aptget_commands(["# apt-get install -y python-pip"])).to.have.length(0);
      expect(apt.aptget_commands(["echo test", "apt-get install -y python-pip"])).to.have.length(1);
      expect(apt.aptget_commands(["apt-get install -y python-pip", "apt-get remove -y python-pip"])).to.have.length(2);
    });
  });

  describe("#aptget_subcommand(command)", function(){
    it("retrieves the subcommand passed to apt-get", function(){
      expect(apt.aptget_subcommand("apt-get install -y python-pip")).to.equal('install');
      expect(apt.aptget_subcommand("apt-get remove -y python-pip")).to.equal('remove');
    });
  });

  describe("#aptget_hasyes(command)", function(){
    it("validates that -y flag is present on apt-get (update|install|remove) commands", function(){
      expect(apt.aptget_hasyes("apt-get install -y python-pip")).to.equal(true);
      expect(apt.aptget_hasyes("apt-get install --yes python-pip")).to.equal(true);
      expect(apt.aptget_hasyes("apt-get install --assume-yes python-pip")).to.equal(true);
      expect(apt.aptget_hasyes("apt-get install python-pip")).to.equal(false);
    });
  });

  describe("#aptget_hasnorecommends(command)", function(){
    it("validates that --no-recommends flag is present on apt-get install commands", function(){
      expect(apt.aptget_hasnorecommends("apt-get install -y --no-install-recommends python-pip")).to.equal(true);
      expect(apt.aptget_hasnorecommends("apt-get install -y python-pip")).to.equal(false);
    });
  });

  describe("#follows_rmaptlists(command)", function(){
    it("validates that a matching rm command is present on apt-get install commands", function(){
      expect(apt.follows_rmaptlists(["apt-get install -y --no--install-recommends python-pip"], 0)).to.equal(false);
      expect(apt.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rm -rf /var/lib/apt/lists/*"], 1)).to.equal(false);
      expect(apt.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rmrf -rf /var/lib/apt/lists/*"], 0)).to.equal(false);
      expect(apt.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rm -rf /var/lib/apt/lists"], 0)).to.equal(false);
      expect(apt.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rm --force /var/lib/apt/lists/*"], 0)).to.equal(false);
      expect(apt.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rm -r /var/lib/apt/lists/*"], 0)).to.equal(false);
      expect(apt.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rm -rfv /var/lib/apt/lists/*"], 0)).to.equal(true);
      expect(apt.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rm -fR /var/lib/apt/lists/*"], 0)).to.equal(true);
      expect(apt.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rm --force -r /var/lib/apt/lists/*"], 0)).to.equal(true);
      expect(apt.follows_rmaptlists(["apt-get install -y --no-install-recommends python-pip", "rm --force --recursive /var/lib/apt/lists/*"], 0)).to.equal(true);
    });
  });
});
