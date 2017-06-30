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

  describe('#addFile(file, fileContent, items)', () => {
    it('ignores an invalid file argument', () => {
      let reporter = new JsonReporter().addFile(null);
      expect(reporter.fileReports).to.be.empty;
    });

    it('adds a good report when no items given', () => {
      let file = './test/examples/Dockerfile.busybox';
      let reporter = new JsonReporter().addFile(file, fs.readFileSync(file, 'UTF-8'), []);
      expect(Object.keys(reporter.fileReports)).to.have.length(1);
      let fileReport = reporter.fileReports[file];
      expect(fileReport.itemsByLine).to.be.empty;
      expect(fileReport.uniqueIssues).to.equal(0);
      expect(fileReport.contentArray).to.have.length(4);
    });

    it('modifies existing report when same file added twice', () => {
      let file = './test/examples/Dockerfile.registry';
      let fileContent = fs.readFileSync(file, 'UTF-8');
      let item = {
        title: 'Consider `--no-install-recommends`',
        description: 'Consider using a `--no-install-recommends` when `apt-get` installing packages.  This will result in a smaller image size.  For\nmore information, see [this blog post](http://blog.replicated.com/2016/02/05/refactoring-a-dockerfile-for-image-size/)',
        category: 'Optimization',
        line: 5
      };
      let reporter = new JsonReporter()
        .addFile(file, fileContent, [])
        .addFile(file, fileContent, [ item ]);
      expect(Object.keys(reporter.fileReports)).to.have.length(1);
      let fileReport = reporter.fileReports[file];
      expect(fileReport.uniqueIssues).to.equal(1);
      expect(fileReport.contentArray).to.have.length(16);
      expect(fileReport.itemsByLine).to.deep.equal({
        '5': [ item ]
      });
    });

    it('groups multiple items by line number', () => {
      let file = './test/examples/Dockerfile.misc';
      let fileContent = fs.readFileSync(file, 'UTF-8');
      let items = [
        {
          title: 'Base Image Missing Tag',
          description: 'Base images should specify a tag to use.',
          category: 'Clarity',
          line: 5
        },
        {
          title: 'First Command Must Be FROM',
          description: 'The first instruction in a Dockerfile must specify the base image using a FROM command.  Additionally, FROM cannot appear later in a Dockerfile.',
          category: 'Possible Bug',
          line: 6
        },
        {
          title: 'Base Image Latest Tag',
          description: 'Base images should not use the latest tag.',
          category: 'Clarity',
          line: 6
        }
      ];
      let reporter = new JsonReporter().addFile(file, fileContent, items);
      expect(Object.keys(reporter.fileReports)).to.have.length(1);
      let fileReport = reporter.fileReports[file];
      expect(fileReport.uniqueIssues).to.equal(3);
      expect(fileReport.contentArray).to.have.length(40);
      expect(fileReport.itemsByLine).to.deep.equal({
        '5': [ items[0] ],
        '6': items.splice(1)
      });
    });

    it('ignores duplicate items', () => {
      let file = './test/examples/Dockerfile.misc';
      let fileContent = fs.readFileSync(file, 'UTF-8');
      let items = [
        {
          title: 'First Command Must Be FROM',
          description: 'The first instruction in a Dockerfile must specify the base image using a FROM command.  Additionally, FROM cannot appear later in a Dockerfile.',
          category: 'Possible Bug',
          line: 6
        },
        {
          title: 'First Command Must Be FROM',
          description: 'The first instruction in a Dockerfile must specify the base image using a FROM command.  Additionally, FROM cannot appear later in a Dockerfile.',
          category: 'Possible Bug',
          line: 6
        }
      ];
      let reporter = new JsonReporter().addFile(file, fileContent, items);
      expect(Object.keys(reporter.fileReports)).to.have.length(1);
      let fileReport = reporter.fileReports[file];
      expect(fileReport.uniqueIssues).to.equal(1);
      expect(fileReport.contentArray).to.have.length(40);
      expect(fileReport.itemsByLine).to.deep.equal({
        '6': [ items[0] ]
      });
    });

    it('allows multiple files to be added', () => {
      let file1 = './test/examples/Dockerfile.registry';
      let file1Content = fs.readFileSync(file1, 'UTF-8');
      let file1Items = [
        {
          title: 'Consider `--no-install-recommends`',
          description: 'Consider using a `--no-install-recommends` when `apt-get` installing packages.  This will result in a smaller image size.  For\nmore information, see [this blog post](http://blog.replicated.com/2016/02/05/refactoring-a-dockerfile-for-image-size/)',
          category: 'Optimization',
          line: 5
        }
      ];
      let file2 = './test/examples/Dockerfile.misc';
      let file2Content = fs.readFileSync(file2, 'UTF-8');
      let file2Items = [
        {
          title: 'Base Image Missing Tag',
          description: 'Base images should specify a tag to use.',
          category: 'Clarity',
          line: 5
        },
        {
          title: 'First Command Must Be FROM',
          description: 'The first instruction in a Dockerfile must specify the base image using a FROM command.  Additionally, FROM cannot appear later in a Dockerfile.',
          category: 'Possible Bug',
          line: 6
        }
      ];
      let reporter = new JsonReporter()
        .addFile(file1, file1Content, file1Items)
        .addFile(file2, file2Content, file2Items);
      expect(Object.keys(reporter.fileReports)).to.have.length(2);
      let file1Report = reporter.fileReports[file1];
      expect(file1Report.uniqueIssues).to.equal(1);
      expect(file1Report.contentArray).to.have.length(16);
      expect(file1Report.itemsByLine).to.deep.equal({
        '5': file1Items
      });
      let file2Report = reporter.fileReports[file2];
      expect(file2Report.uniqueIssues).to.equal(2);
      expect(file2Report.contentArray).to.have.length(40);
      expect(file2Report.itemsByLine).to.deep.equal({
        '5': [ file2Items[0] ],
        '6': [ file2Items[1] ]
      });
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
          title: 'Base Image Missing Tag',
          description: 'Base images should specify a tag to use.',
          category: 'Clarity',
          content: 'FROM ubuntu',
          line: 5
        },
        {
          title: 'First Command Must Be FROM',
          description: 'The first instruction in a Dockerfile must specify the base image using a FROM command.  Additionally, FROM cannot appear later in a Dockerfile.',
          category: 'Possible Bug',
          content: 'FROM ubuntu:latest',
          line: 6
        },
        {
          title: 'Base Image Latest Tag',
          description: 'Base images should not use the latest tag.',
          category: 'Clarity',
          content: 'FROM ubuntu:latest',
          line: 6
        },
        {
          title: 'Expose Only Container Port',
          description: 'Using `EXPOSE` to specify a host port is not allowed.',
          category: 'Deprecation',
          content: 'EXPOSE 80:80',
          line: 25
        }
      ];
      let report = new JsonReporter()
        .addFile(file, fs.readFileSync(file, 'UTF-8'), [])
        .buildReport();
      let expectedJson = {
        files: [
          { file: file, issues_count: 4, issues: items }
        ],
        totalIssues: 0
      };

      expect(report.totalIssues).to.equal(4);
      expect(report.toString()).to.equal(JSON.stringify(expectedJson));
    });
  });
});
