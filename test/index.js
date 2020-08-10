var expect = require('chai').expect
var dockerfilelint = require('../lib/index');
var fs = require('fs');
var _ = require('lodash');

describe("index", function(){
  describe("#busybox", function(){
    it("validates the busybox Dockerfile has no issues", function(){
      expect(dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.busybox', 'UTF-8'))).to.be.empty;
    });
  });

  describe("#debian", function(){
    it("validates the debian Dockerfile has no issues", function(){
      expect(dockerfilelint.run('./test/invalid', fs.readFileSync('./test/examples/Dockerfile.debian', 'UTF-8'))).to.be.empty;
    });
  });

  describe("#mongo", function(){
    it("validates the mongo Dockerfile has 1 issue (known issue)", function(){
      expect(dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.mongo', 'UTF-8'))).to.have.length(1);
    });
  });

  describe("#mysql", function(){
    it("validates the mysql Dockerfile has 1 issue (known issue)", function(){
      expect(dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.mysql', 'UTF-8'))).to.have.length(1);
    });
  });

  describe("#nginx", function(){
    it("validates the nginx Dockerfile has 2 issue (known issue)", function(){
      expect(dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.nginx', 'UTF-8'))).to.have.length(2);
    });
  });

  describe("#node", function(){
    it("validates the node Dockerfile has no issues", function(){
      expect(dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.node', 'UTF-8'))).to.be.empty;
    });
  });

  describe("#redis", function(){
    it("validates the redis Dockerfile has no issues", function(){
      expect(dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.redis', 'UTF-8'))).to.be.empty;
    });
  });

  describe("#registry", function(){
    it("validates the mysql Dockerfile has 1 issue (known issue)", function(){
      expect(dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.registry', 'UTF-8'))).to.have.length(1);
    });
  });

  describe("#swarm", function(){
    it("validates the swarm Dockerfile has no issues", function(){
      expect(dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.swarm', 'UTF-8'))).to.be.empty;
    });
  });

  describe("#ubuntu", function(){
    it("validates the ubuntu Dockerfile has no issues", function(){
      expect(dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.ubuntu', 'UTF-8'))).to.be.empty;
    });
  });

  describe("#multistage", function(){
    it("validates the multistage Dockerfile has no issues", function(){
      expect(dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.multistage', 'UTF-8'))).to.be.empty;
    });

    it("validates the multistagenamed Dockerfile has no issues", function(){
      expect(dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.multistagenamed', 'UTF-8'))).to.be.empty;
    });
  });

  describe("#arg-before-from", function () {
    it("validates the Dockerfile has no issues", function () {
      const lintResult = dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.arg-before-from', 'UTF-8'));
      expect(lintResult).to.be.an('array').that.is.empty;
    });
  });

  describe("#from-with-as", function () {
    it("validates the Dockerfile detects latest when using as", function () {
      var expected = [
        { title: 'Base Image Latest Tag',
          line: 1,
          rule: 'latest_tag'}
      ];
      const lintResult = dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.from-as', 'UTF-8'));
      _.forEach(lintResult, function(r) {
        delete r['description'];
        delete r['category'];
      });
      expect(lintResult).to.have.length(expected.length);
      expect(lintResult).to.deep.equal(expected);
    });
  });

  describe("#from-with-port", function () {
    it("validates the Dockerfile detects latest when it has a port", function () {
      var expected = [
        { title: 'Base Image Latest Tag',
          line: 1,
          rule: 'latest_tag'}
      ];
      const lintResult = dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.from-with-port', 'UTF-8'));
      _.forEach(lintResult, function(r) {
        delete r['description'];
        delete r['category'];
      });
      expect(lintResult).to.have.length(expected.length);
      expect(lintResult).to.deep.equal(expected);
    });
  });

  describe("#from-with-port-no-latest", function () {
    it("validates the Dockerfile detects not latest when it has a port", function () {
      const lintResult = dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.from-with-port-no-latest', 'UTF-8'));
      expect(lintResult).to.have.length(0);
    });
  });

  describe("#shell", function() {
    it("validates the shell command is accepted when entered correctly", function() {
      expect(dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.shell.pass', 'UTF-8'))).to.be.empty;
    });

    it("validates the shell command detects invalid shell commands", function() {
      var expected = [
        { title: 'Invalid Argument Format',
          line: 4,
          rule: 'invalid_format'}
      ];
      var result = dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.shell.fail', 'UTF-8'));
      _.forEach(result, function(r) {
        delete r['description'];
        delete r['category'];
      });
      expect(result).to.have.length(expected.length);
      expect(result).to.deep.equal(expected);
    });
  });

  describe("#misc", function(){
    it("validates the misc Dockerfile have the exact right issues reported", function(){
      var expected = [
          { title: 'First Command Must Be FROM or ARG',
            rule: 'from_first',
            line: 4 },
          { title: 'Base Image Missing Tag',
            rule: 'missing_tag',
            line: 5 },
          { title: 'Base Image Latest Tag',
            rule: 'latest_tag',
            line: 6 },
          { title: 'Capitalize Dockerfile Instructions',
            rule: 'uppercase_commands',
            line: 7 },
          { title: 'Invalid Command',
            rule: 'invalid_command',
            line: 7 },
          { title: 'Missing Arguments',
            rule: 'missing_args',
            line: 9 },
          { title: 'Deprecated as of Docker 1.13',
            rule: 'deprecated_in_1.13',
            line: 9 },
          { title: 'Missing Required Arguments',
            rule: 'required_params',
            line: 11 },
          { title: 'Invalid Line',
            rule: 'invalid_line',
            line: 11 },
          { title: 'Use Of sudo Is Not Allowed',
            rule: 'sudo_usage',
            line: 12 },
          { title: 'Missing parameter for `apt-get`',
            rule: 'apt-get_missing_param',
            line: 13 },
          { title: '`apt-get upgrade` Is Not Allowed',
            rule: 'apt-get-upgrade',
            line: 13 },
          { title: 'Missing parameter for `apt-get`',
            rule: 'apt-get_missing_param',
            line: 14 },
          { title: 'Consider `--no-install-recommends`',
            rule: 'apt-get_recommends',
            line: 14 },
          { title: 'apt-get dist-upgrade Is Not Allowed',
            rule: 'apt-get-dist-upgrade',
            line: 15 },
          { title: 'apt-get update with matching cache rm',
            rule: 'apt-get_missing_rm',
            line: 16 },
          { title: 'apt-get update without matching apt-get install',
            rule: 'apt-get-update_require_install',
            line: 16 },
          { title: 'Consider `--no-cache or --update with rm -rf /var/cache/apk/*`',
            rule: 'apkadd-missing_nocache_or_updaterm',
            line: 21 },
          { title: 'Consider `--virtual` when using apk add and del together in a command.',
            rule: 'apkadd-missing-virtual',
            line: 22 },
          { title: 'Invalid Port Exposed',
            rule: 'invalid_port',
            line: 24 },
          { title: 'Expose Only Container Port',
            rule: 'expose_host_port',
            line: 25 },
          { title: 'Invalid Argument Format',
            rule: 'invalid_format',
            line: 27 },
          { title: 'Label Is Invalid',
            rule: 'label_invalid',
            line: 29 },
          { title: 'Extra Arguments',
            rule: 'extra_args',
            line: 31 },
          { title: 'Invalid WORKDIR',
            rule: 'invalid_workdir',
            line: 32 },
          { title: 'Invalid ADD Source',
            rule: 'add_src_invalid',
            line: 36 },
          { title: 'Invalid ADD Destination',
            rule: 'add_dest_invalid',
            line: 36 }
        ];

      var result = dockerfilelint.run('./test/examples', fs.readFileSync('./test/examples/Dockerfile.misc', 'UTF-8'));
      expect(result).to.have.length(expected.length);

      _.forEach(result, function(r) {
        delete r['description'];
        delete r['category'];
      });

      expect(result).to.deep.equal(expected);
    });
  });
});
