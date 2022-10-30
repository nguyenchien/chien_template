import * as path from 'path';

export function prepareStylelintResults(results) {
  return results
    .sort((a, b) => a.warnings.length - b.warnings.length)
    .map((result) => {
      result.relativeFilePath = path.relative(".", result.source);
      result.warnings.sort((a, b) => {
        if (a.severity === b.severity) {
          if (a.line === b.line) {
            return a.column < b.column ? -1 : 1;
          }

          return a.line < b.line ? -1 : 1;
        }

        if (a.severity === 2 && b.severity !== 2) {
          return 1;
        }

        return -1;
      });
      return result;
    });
}

export function prepareESLintResults(results) {
  return results
    .sort((a, b) => {
      if (a.errorCount === b.errorCount) {
        return b.warningCount - a.warningCount;
      }

      if (a.errorCount === 0) {
        return -1;
      }

      if (b.errorCount === 0) {
        return 1;
      }

      return b.errorCount - a.errorCount;
    })
    .map((result) => {
      result.relativeFilePath = path.relative(".", result.filePath);
      result.messages.sort((a, b) => {
        if (a.fatal === b.fatal && a.severity === b.severity) {
          if (a.line === b.line) {
            return a.column < b.column ? -1 : 1;
          }

          return a.line < b.line ? -1 : 1;
        }

        if ((a.fatal || a.severity === 2) && (!b.fatal || b.severity !== 2)) {
          return 1;
        }

        return -1;
      });
      return result;
    });
}
