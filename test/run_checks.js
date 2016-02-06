var expect = require('chai').expect
var run_checks = require('../lib/run_checks.js')

describe("run_checks", function(){
  describe("#aptget_commands(args)", function(){
    it("extracts apt-get commands from longer bash command", function(){
      expect(run_checks.aptget_commands("apt-get install -y python-pip")).to.have.length(1);
      expect(run_checks.aptget_commands("# apt-get install -y python-pip")).to.have.length(0);
      expect(run_checks.aptget_commands("echo test && apt-get install -y python-pip")).to.have.length(1);
      expect(run_checks.aptget_commands("apt-get install -y python-pip && apt-get remove -y python-pip")).to.have.length(2);
    });
  });

  describe("#aptget_subcommand(command)", function(){
    it("retrieves the subcommand passed to apt-get", function(){
      expect(run_checks.aptget_subcommand("apt-get install -y python-pip")).to.equal('install');
      expect(run_checks.aptget_subcommand("apt-get remove -y python-pip")).to.equal('remove');
    });
  });

  describe("#aptget_with_yes(command)", function(){
    it("validates that -y flag is present on apt-get (update|install|remove) commands", function(){
      expect(run_checks.aptget_hasyes("apt-get install -y python-pip")).to.equal(true);
      expect(run_checks.aptget_hasyes("apt-get install python-pip")).to.equal(false);
    });
  });

  describe("#aptget_install_with_norecommends(command)", function(){
    it("validates that --no-recommends flag is present on apt-get install commands", function(){
      expect(run_checks.aptget_hasnorecommends("apt-get install -y --no-install-recommends python-pip")).to.equal(true);
      expect(run_checks.aptget_hasnorecommends("apt-get install -y python-pip")).to.equal(false);
    });
  });

  describe("#aptget_install_with_rmaptlist(command)", function(){
    it("validates that a matching rm command is present on apt-get install commands", function(){
      expect(run_checks.includes_rmaptlists("apt-get install -y --no--install-recommends python-pip")).to.equal(false);
      expect(run_checks.includes_rmaptlists("apt-get install -y --no-install-recommends python-pip && rm -rf /var/lib/apt/lists/*")).to.equal(true);
      expect(run_checks.includes_rmaptlists("apt-get install -y --no-install-recommends python-pip && rm -fr /var/lib/apt/lists/*")).to.equal(true);
    });
  });
});
