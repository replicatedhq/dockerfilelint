'use strict';

const notDeepStrictEqual = require('assert').notDeepStrictEqual;

class Reporter {
  constructor (opts) {
    this.fileReports = {};
  }

  // group file items by line for easy reporting
  addFile (file, fileContent, items) {
    let self = this;
    if (!file) return self;
    let fileReport = self.fileReports[file] || {
      itemsByLine: {},
      uniqueIssues: 0,
      contentArray: (fileContent || '').replace('\r', '').split('\n')
    };
    let ibl = fileReport.itemsByLine;
    [].concat(items).forEach((item) => {
      if (ibl[String(item.line)]) {
        try {
          ibl[String(item.line)].forEach((lineItem) => {
            notDeepStrictEqual(item, lineItem);
          });
          ibl[String(item.line)].push(item);
          fileReport.uniqueIssues = fileReport.uniqueIssues + 1;
        } catch (err) {
          // ignore duplicate
        }
      } else {
        ibl[String(item.line)] = [ item ];
        fileReport.uniqueIssues = fileReport.uniqueIssues + 1;
      }
    });
    self.fileReports[file] = fileReport;
    return self;
  }

  // build a report object for data given via addFile
  buildReport () {
    // TO BE OVERRIDDEN BY SUB CLASSES
    throw new Error("#buildReport() must be defined in a child class");
  }
}

module.exports = Reporter;
