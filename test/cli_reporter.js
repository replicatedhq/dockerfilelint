'use strict';

var chalk = require('chalk');
var expect = require('chai').expect;
var fs = require('fs');
var CliReporter = require('../lib/cli_reporter.js');

describe('cli_reporter', () => {
  describe('#constructor(opts)', () => {
    it('sets defaults with no options given', () => {
      let reporter = new CliReporter();
      expect(reporter.ui.width).to.equal(110);
      expect(reporter.ui.wrap).to.equal(true);
      expect(reporter.issueTitleWidth).to.equal(22);
      expect(reporter.styles['Deprecation']).to.be.a.function;
      expect(reporter.styles['Possible Bug']).to.be.a.function;
      expect(reporter.styles['Clarity']).to.be.a.function;
      expect(reporter.styles['Optimization']).to.be.a.function;
      expect(reporter.fileReports).to.be.empty;
    });

    it('accepts width and wrap', () => {
      let reporter = new CliReporter({ width: 200, wrap: false });
      expect(reporter.ui.width).to.equal(200);
      expect(reporter.ui.wrap).to.equal(false);
      expect(reporter.issueTitleWidth).to.equal(40);
    });

    it('doesn\'t blow up when width is NaN', () => {
      let reporter = new CliReporter({ width: 'hello' });
      expect(reporter.ui.width).to.equal(110);
      expect(reporter.ui.wrap).to.equal(true);
      expect(reporter.issueTitleWidth).to.equal(22);
    });
  });

  describe('#addFile(file, fileContent, items)', () => {
    it('ignores an invalid file argument', () => {
      let reporter = new CliReporter().addFile(null);
      expect(reporter.fileReports).to.be.empty;
    });

    it('adds a good report when no items given', () => {
      let file = './test/examples/Dockerfile.busybox';
      let reporter = new CliReporter().addFile(file, fs.readFileSync(file, 'UTF-8'), []);
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
      let reporter = new CliReporter()
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
      let reporter = new CliReporter().addFile(file, fileContent, items);
      expect(Object.keys(reporter.fileReports)).to.have.length(1);
      let fileReport = reporter.fileReports[file];
      expect(fileReport.uniqueIssues).to.equal(3);
      expect(fileReport.contentArray).to.have.length(35);
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
      let reporter = new CliReporter().addFile(file, fileContent, items);
      expect(Object.keys(reporter.fileReports)).to.have.length(1);
      let fileReport = reporter.fileReports[file];
      expect(fileReport.uniqueIssues).to.equal(1);
      expect(fileReport.contentArray).to.have.length(35);
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
      let reporter = new CliReporter()
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
      expect(file2Report.contentArray).to.have.length(35);
      expect(file2Report.itemsByLine).to.deep.equal({
        '5': [ file2Items[0] ],
        '6': [ file2Items[1] ]
      });
    });
  });

  describe('#buildReport()', () => {
    it('returns blank report if no files added', () => {
      let report = new CliReporter().buildReport();
      expect(report.totalIssues).to.equal(0);
      expect(report.toString()).to.equal('');
    });

    it('returns green report when one file added with no issues', () => {
      let file = './test/examples/Dockerfile.busybox';
      let report = new CliReporter()
        .addFile(file, fs.readFileSync(file, 'UTF-8'), [])
        .buildReport();
      expect(report.totalIssues).to.equal(0);
      expect(report.toString().split('\n')).to.deep.equal([
        '',
        'File:   ' + file,
        'Issues: \u001b[32mNone found\u001b[39m 👍',
        ''
      ]);
    });

    it('returns green report when multiple files added with no issues', () => {
      let file1 = './test/examples/Dockerfile.busybox';
      let file2 = './test/examples/Dockerfile.debian';
      let report = new CliReporter()
        .addFile(file1, fs.readFileSync(file1, 'UTF-8'), [])
        .addFile(file2, fs.readFileSync(file2, 'UTF-8'), [])
        .buildReport();
      expect(report.totalIssues).to.equal(0);
      expect(report.toString().split('\n')).to.deep.equal([
        '',
        'File:   ' + file1,
        'Issues: ' + chalk.green('None found') + ' 👍',
        '',
        'File:   ' + file2,
        'Issues: ' + chalk.green('None found') + ' 👍',
        ''
      ]);
    });

    it('returns pretty report when file added with issues', () => {
      let file = './test/examples/Dockerfile.misc';
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
        },
        {
          title: 'Expose Only Container Port',
          description: 'Using `EXPOSE` to specify a host port is not allowed.',
          category: 'Deprecation',
          line: 21
        }
      ];
      let report = new CliReporter()
        .addFile(file, fs.readFileSync(file, 'UTF-8'), items)
        .buildReport();
      expect(report.totalIssues).to.equal(4);
      expect(report.toString().split('\n')).to.deep.equal([
        '',
        'File:   ' + file,
        'Issues: 4',
        '',
        'Line 5: ' + chalk.magenta('FROM ubuntu'),
        'Issue  Category      Title                 Description',
        '    ' + chalk.cyan('1') + '  ' + chalk.cyan.inverse('Clarity') + '       ' + chalk.cyan('Base Image Missing') + '    ' + chalk.gray('Base images should specify a tag to use.'),
        '                     ' + chalk.cyan('Tag'),
        '',
        'Line 6: ' + chalk.magenta('FROM ubuntu:latest'),
        'Issue  Category      Title                 Description',
        '    ' + chalk.yellow('2') + '  ' + chalk.yellow.inverse('Possible Bug') + '  ' + chalk.yellow('First Command Must') + '    ' + chalk.gray('The first instruction in a Dockerfile must specify the base image'),
        '                     ' + chalk.yellow('Be FROM') + '               ' + chalk.gray('using a FROM command.  Additionally, FROM cannot appear later in a'),
        '                                           ' + chalk.gray('Dockerfile.'),
        '    ' + chalk.cyan('3') + '  ' + chalk.cyan.inverse('Clarity') + '       ' + chalk.cyan('Base Image Latest') + '     ' + chalk.gray('Base images should not use the latest tag.'),
        '                     ' + chalk.cyan('Tag'),
        '',
        'Line 21: ' + chalk.magenta('EXPOSE 80:80'),
        'Issue  Category      Title                 Description',
        '    ' + chalk.red('4') + '  ' + chalk.red.inverse('Deprecation') + '   ' + chalk.red('Expose Only') + '           ' + chalk.gray('Using `EXPOSE` to specify a host port is not allowed.'),
        '                     ' + chalk.red('Container Port'),
        ''
      ]);
    });

    it('uses Clarity style for unknown category', () => {
      let file = './test/examples/Dockerfile.registry';
      let fileContent = fs.readFileSync(file, 'UTF-8');
      let item = {
        title: 'Hello World!',
        description: 'This is a test.',
        category: 'Hello',
        line: 5
      };
      let report = new CliReporter()
        .addFile(file, fs.readFileSync(file, 'UTF-8'), [ item ])
        .buildReport();
      expect(report.totalIssues).to.equal(1);
      expect(report.toString().split('\n')).to.deep.equal([
        '',
        'File:   ' + file,
        'Issues: 1',
        '',
        'Line 5: ' + chalk.magenta('RUN apt-get update && \\'),
        'Issue  Category      Title                 Description',
        '    ' + chalk.cyan('1') + '  ' + chalk.cyan.inverse('Hello') + '         ' + chalk.cyan('Hello World!') + '          ' + chalk.gray('This is a test.'),
        ''
      ]);
    });
  });
});
