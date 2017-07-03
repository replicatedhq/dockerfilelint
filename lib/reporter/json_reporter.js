// {
//   "file": "file",
//   "issues_count": 3,
//   "issues" : [
//     {
//       "line": 4,
//       "content": "FROM ...",
//       "category": "clarity",
//       "title": "...",
//       "description": "...."
//     }, ..., {}
//   ]
// }

'use strict';

const Reporter = require('./reporter');

class JsonReporter extends Reporter {
  constructor (opts) {
    super(opts);

    this.json = {};
  }

  // build a report object for data given via addFile
  buildReport () {
    let self = this;
    let totalIssues = 0;
    let reportFiles = [];

    Object.keys(self.fileReports).forEach((file) => {
      let fileReport = self.fileReports[file];
      let linesWithItems = Object.keys(fileReport.itemsByLine);

      let jsonReport = { file: file, issues_count: fileReport.uniqueIssues, issues: [] };

      if (linesWithItems.length === 0) {
        reportFiles.push(jsonReport);
        return;
      }

      totalIssues += fileReport.uniqueIssues;

      linesWithItems.forEach((lineNum) => {
        let lineContent = fileReport.contentArray[parseInt(lineNum, 10) - 1];

        fileReport.itemsByLine[lineNum].forEach((item) => {
          let lineIssueJson = {
            line: lineNum,
            content: lineContent,
            category: item.category,
            title: item.title,
            description: item.description
          };

          jsonReport.issues.push(lineIssueJson);
        });
      });

      reportFiles.push(jsonReport);
    });

    this.json.files = reportFiles;
    this.json.totalIssues = totalIssues;

    return { toString: () => JSON.stringify(this.json), totalIssues: totalIssues };
  }
}

module.exports = JsonReporter;
