'use strict';

var expect = require('chai').expect;
var fs = require('fs');
var Reporter = require('../lib/reporter/reporter.js');

describe('reporter', () => {
  describe('#constructor(opts)', () => {
    it('sets defaults with no options given', () => {
      let reporter = new Reporter();
      expect(reporter.fileReports).to.be.empty;
    });
  });

  describe('#addFile(file, fileContent, items)', () => {
    it('ignores an invalid file argument', () => {
      let reporter = new Reporter().addFile(null);
      expect(reporter.fileReports).to.be.empty;
    });

    it('adds a good report when no items given', () => {
      let file = './test/examples/Dockerfile.busybox';
      let reporter = new Reporter().addFile(file, fs.readFileSync(file, 'UTF-8'), []);
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
      let reporter = new Reporter()
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
      let reporter = new Reporter().addFile(file, fileContent, items);
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
      let reporter = new Reporter().addFile(file, fileContent, items);
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
      let reporter = new Reporter()
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
    it('raises when called from base reporter class', () => {
      let reporter = new Reporter();
      expect(function() { reporter.buildReport(); }).to.throw();
    });
  });
});
