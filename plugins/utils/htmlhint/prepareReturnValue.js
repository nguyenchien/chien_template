function prepareReturnValue(results, maxWarnings, formatter, cwd) {
  const errored = results.some(result => result.warnings.length > 0);
  const returnValue = {
    cwd,
    errored,
    results: [],
    output: '',
  };

  if (maxWarnings !== undefined) {
    const foundWarnings = results.reduce((count, file) => count + file.warnings.length, 0);

    if (foundWarnings > maxWarnings) {
      returnValue.maxWarningsExceeded = { maxWarnings, foundWarnings };
    }
  }

  returnValue.output += formatter(results);
  returnValue.results = results;

  return returnValue;
}

export default prepareReturnValue;