'use strict';

var expect = require('chai').expect;
var fs = require('fs');
var JsonReporter = require('../lib/reporter/json_reporter.js');

describe('json_reporter', () => {
  describe('#constructor(opts)', () => {
    it('sets defaults with no options given', () => {
      let reporter = new JsonReporter();
      expect(reporter.fileReports).to.be.empty;
      expect(reporter.json).to.be.empty;
    });
  });

  describe('#buildReport()', () => {
    it('returns json with empty files array if no files added', () => {
      let report = new JsonReporter().buildReport();
      let expectedJson = { files: [], totalIssues: 0 };
      expect(report.totalIssues).to.equal(0);
      expect(report.toString()).to.equal(JSON.stringify(expectedJson));
    });

    it('returns json with a file that has no issues associated on green build', () => {
      let file = './test/examples/Dockerfile.busybox';
      let report = new JsonReporter()
        .addFile(file, fs.readFileSync(file, 'UTF-8'), [])
        .buildReport();
      let expectedJson = {
        files: [
          { file: file, issues_count: 0, issues: [] }
        ],
        totalIssues: 0
      };

      expect(report.totalIssues).to.equal(0);
      expect(report.toString()).to.equal(JSON.stringify(expectedJson));
    });

    it('returns json with multiple files that have no issues associated on green build', () => {
      let file1 = './test/examples/Dockerfile.busybox';
      let file2 = './test/examples/Dockerfile.debian';
      let report = new JsonReporter()
        .addFile(file1, fs.readFileSync(file1, 'UTF-8'), [])
        .addFile(file2, fs.readFileSync(file2, 'UTF-8'), [])
        .buildReport();
      let expectedJson = {
        files: [
          { file: file1, issues_count: 0, issues: [] },
          { file: file2, issues_count: 0, issues: [] }
        ],
        totalIssues: 0
      };

      expect(report.totalIssues).to.equal(0);
      expect(report.toString()).to.equal(JSON.stringify(expectedJson));
    });

    it('returns json with built up issues when a file with issues is added', () => {
      let file = './test/examples/Dockerfile.misc';
      let items = [
        {
          line: '5',
          content: 'FROM ubuntu',
          category: 'Clarity',
          title: 'Base Image Missing Tag',
          description: 'Base images should specify a tag to use.'
        },
        {
          line: '6',
          content: 'FROM ubuntu:latest',
          category: 'Possible Bug',
          title: 'First Command Must Be FROM',
          description: 'The first instruction in a Dockerfile must specify the base image using a FROM command.  Additionally, FROM cannot appear later in a Dockerfile.'
        },
        {
          line: '6',
          content: 'FROM ubuntu:latest',
          category: 'Clarity',
          title: 'Base Image Latest Tag',
          description: 'Base images should not use the latest tag.'
        },
        {
          line: '25',
          content: 'EXPOSE 80:80',
          category: 'Deprecation',
          title: 'Expose Only Container Port',
          description: 'Using `EXPOSE` to specify a host port is not allowed.'
        }
      ];
      let report = new JsonReporter()
        .addFile(file, fs.readFileSync(file, 'UTF-8'), items)
        .buildReport();
      let expectedJson = {
        files: [
          { file: file, issues_count: 4, issues: items }
        ],
        totalIssues: 4
      };

      expect(report.totalIssues).to.equal(4);
      expect(report.toString()).to.equal(JSON.stringify(expectedJson));
    });
  });
});
