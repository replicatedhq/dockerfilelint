var expect = require('chai').expect
var dockerfilelint = require('../lib/index');
var fs = require('fs');

describe("index", function(){
  describe("#busybox", function(){
    it("validates the busybox Dockerfile has no issues", function(){
      expect(dockerfilelint.run(fs.readFileSync('./test/examples/Dockerfile.busybox', 'UTF-8'))).to.be.empty;
    });
  });

  describe("#debian", function(){
    it("validates the debian Dockerfile has no issues", function(){
      expect(dockerfilelint.run(fs.readFileSync('./test/examples/Dockerfile.debian', 'UTF-8'))).to.be.empty;
    });
  });

  describe("#mongo", function(){
    it("validates the mongo Dockerfile has 1 issue (known issue)", function(){
      expect(dockerfilelint.run(fs.readFileSync('./test/examples/Dockerfile.mongo', 'UTF-8'))).to.have.length(1);
    });
  });

  describe("#mysql", function(){
    it("validates the mysql Dockerfile has 1 issue (known issue)", function(){
      expect(dockerfilelint.run(fs.readFileSync('./test/examples/Dockerfile.mysql', 'UTF-8'))).to.have.length(1);
    });
  });

  describe("#nginx", function(){
    it("validates the nginx Dockerfile has 1 issue (known issue)", function(){
      expect(dockerfilelint.run(fs.readFileSync('./test/examples/Dockerfile.nginx', 'UTF-8'))).to.have.length(1);
    });
  });

  describe("#node", function(){
    it("validates the node Dockerfile has no issues", function(){
      expect(dockerfilelint.run(fs.readFileSync('./test/examples/Dockerfile.node', 'UTF-8'))).to.be.empty;
    });
  });

  describe("#redis", function(){
    it("validates the redis Dockerfile has no issues", function(){
      expect(dockerfilelint.run(fs.readFileSync('./test/examples/Dockerfile.redis', 'UTF-8'))).to.be.empty;
    });
  });

  describe("#registry", function(){
    it("validates the mysql Dockerfile has 1 issue (known issue)", function(){
      expect(dockerfilelint.run(fs.readFileSync('./test/examples/Dockerfile.registry', 'UTF-8'))).to.have.length(1);
    });
  });

  describe("#swarm", function(){
    it("validates the swarm Dockerfile has no issues", function(){
      expect(dockerfilelint.run(fs.readFileSync('./test/examples/Dockerfile.swarm', 'UTF-8'))).to.be.empty;
    });
  });

  describe("#ubuntu", function(){
    it("validates the ubuntu Dockerfile has no issues", function(){
      expect(dockerfilelint.run(fs.readFileSync('./test/examples/Dockerfile.ubuntu', 'UTF-8'))).to.be.empty;
    });
  });

  describe("#misc", function(){
    it("validates the misc Dockerfile has no issues", function(){
      expect(dockerfilelint.run(fs.readFileSync('./test/examples/Dockerfile.misc', 'UTF-8'))).to.be.empty;
    });
  });
});
