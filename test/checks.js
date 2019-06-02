var expect = require('chai').expect
var checks = require('../lib/checks.js')

describe("checks", function(){
  describe("#expose_container_port_only(args)", function(){
    it("validates expose command for no host port", function(){
      expect(checks.expose_container_port_only("8000")).to.be.empty;
      expect(checks.expose_container_port_only("8000:8000")).to.have.length(1);
      expect(checks.expose_container_port_only("8000 8001")).to.be.empty;
      expect(checks.expose_container_port_only("8000 8001:8000")).to.have.length(1);
    });
  });

  describe("#expose_port_valid(port)", function(){
    it("validates expose command for a valid port number", function(){
      expect(checks.expose_port_valid("8000")).to.equal(true);
      expect(checks.expose_port_valid("abc")).to.equal(false);
      expect(checks.expose_port_valid("8000:tcp")).to.equal(false);
      expect(checks.expose_port_valid("99999999")).to.equal(false);
      expect(checks.expose_port_valid("80/tcp")).to.equal(true);
      expect(checks.expose_port_valid("3000/udp")).to.equal(true);
      expect(checks.expose_port_valid("5000/rdp")).to.equal(false);
    });
  });

  describe("#label_format(args)", function(){
    it("validates label command in key=value format", function(){
      expect(checks.label_format("")).to.be.empty;
      expect(checks.label_format("key=value")).to.be.empty;
      expect(checks.label_format("key=value key=value")).to.be.empty;
      expect(checks.label_format("namespace.key=value")).to.be.empty;
      expect(checks.label_format("key=\"value value\"")).to.be.empty;
      expect(checks.label_format("key=value value")).to.have.length(1);
      expect(checks.label_format("key key=value")).to.have.length(1);
      expect(checks.label_format("key=value\\ value")).to.be.empty;
      expect(checks.label_format("key=")).to.be.empty;
      expect(checks.label_format("key=   ")).to.be.empty;
      expect(checks.label_format("key")).to.have.length(1);
      expect(checks.label_format("key value")).to.have.length(1);
    });
  });

  describe("#base_image_tag(args)", function(){
    it("validates base image command", function(){
      expect(checks.base_image_tag("scratch")).to.be.empty;
      expect(checks.base_image_tag("ubuntu:14.04")).to.be.empty;
      expect(checks.base_image_tag("ubuntu:latest")).to.have.length(1);
      expect(checks.base_image_tag("ubuntu")).to.have.length(1);
      expect(checks.base_image_tag("image@digest")).to.be.empty;
    });
  });

  describe("#valid_user(args)", function(){
    it("validates user command has exactly one parameter", function(){
      expect(checks.valid_user("root")).to.be.empty;
      expect(checks.valid_user("root wheel")).to.have.length(1);
    });
  });

  describe("#valid_maintainer(args)", function(){
    it("validates maintainer command has exactly one maintainer and outputs MAINTAINER is deprecated in 1.13", function(){
      expect(checks.valid_maintainer("user <test@gmail.com>")).to.have.length(1).and.to.eql(['deprecated_in_1.13']);
      expect(checks.valid_maintainer("user without email")).to.have.length(2);
      expect(checks.valid_maintainer("user <test@gmail.com> user2 <test@gmail.com>")).to.have.length(2);
    });
  });

  describe("#param_count_min(args, min_count)", function() {
    it("validates that a argument line, split on whitespace, contains at least min_count elements", function(){
      expect(checks.param_count_min("one", 1)).to.equal(true);
      expect(checks.param_count_min("one", 2)).to.equal(false);
      expect(checks.param_count_min("one two three", 1)).to.equal(true);
      expect(checks.param_count_min("one two three", 4)).to.equal(false);
    })
  });

  describe("#is_dir_in_context(dir)", function() {
    it("validates that a directory is relative (to the docker context)", function(){
      expect(checks.is_dir_in_context("/etc")).to.equal(false);
      expect(checks.is_dir_in_context("../home")).to.equal(false);
      expect(checks.is_dir_in_context("./test")).to.equal(true);
      expect(checks.is_dir_in_context("test")).to.equal(true);
    })
  });

  describe("#is_valid_add(args)", function() {
    it("validates add command is valid", function(){
      expect(checks.is_valid_add("./ test/")).to.be.empty;
      expect(checks.is_valid_add("./ test")).to.be.empty;
      expect(checks.is_valid_add("test? test")).to.have.length(1);
      expect(checks.is_valid_add("test/test* test")).to.have.length(1);
      expect(checks.is_valid_add("/text test/")).to.have.length(1);
      expect(checks.is_valid_add("test test2 test/")).to.be.empty;
      expect(checks.is_valid_add("test test2 test")).to.have.length(1);
    })
  });

  describe("#is_wrapped_in_quotes(str)", function() {
    it("returns a bool indicating if there are matching quotes on each side of a string", function(){
      expect(checks.is_wrapped_in_quotes("test")).to.equal(false);
      expect(checks.is_wrapped_in_quotes("'tes't")).to.equal(false);
      expect(checks.is_wrapped_in_quotes("'test'")).to.equal(true);
      expect(checks.is_wrapped_in_quotes("\"test\"")).to.equal(true);
    })
  }),

  describe("#is_valid_workdir(args)", function() {
    it("validates workdir command is valid", function(){
      expect(checks.is_valid_workdir("test")).to.be.empty;
      expect(checks.is_valid_workdir("/test/test")).to.be.empty;
      expect(checks.is_valid_workdir("test test")).to.have.length(1);
      expect(checks.is_valid_workdir("\"test test\"")).to.be.empty;
      expect(checks.is_valid_workdir("'test test'")).to.be.empty;
    })
  });

  describe("#is_valid_env(args)", function() {
    it("validates env command is valid", function(){
      expect(checks.is_valid_env("test=test")).to.be.empty;
      expect(checks.is_valid_env("test=bad test")).to.have.length(1);
      expect(checks.is_valid_env("test test")).to.be.empty;
      expect(checks.is_valid_env("test longer value")).to.be.empty;
      expect(checks.is_valid_env("test=test test2=test2")).to.be.empty;
    })
  });

  describe("#is_valid_healthcheck(args)", function () {
    it("validates healthcheck command is valid", function(){
      expect(checks.is_valid_healthcheck("none")).to.be.empty;
      expect(checks.is_valid_healthcheck("none invalidargument")).to.eql(['invalid_format']);
      expect(checks.is_valid_healthcheck("--invalid=10s cmd")).to.eql(['invalid_format']);
      expect(checks.is_valid_healthcheck("--interval=10s cmd")).to.be.empty;
      expect(checks.is_valid_healthcheck("--interval=10s cmd argument --someotherargument")).to.be.empty;
      expect(checks.is_valid_healthcheck("--interval cmd argument")).to.eql(['healthcheck_options_missing_args']);
      expect(checks.is_valid_healthcheck("--interval=10s --timeout cmd argument")).to.eql(['healthcheck_options_missing_args']);
    })
  });
});
