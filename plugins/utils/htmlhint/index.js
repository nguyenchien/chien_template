import fs from 'fs';
import globby from 'globby';
import fastGlob from 'fast-glob';
import { normalizePath } from 'vite';
import path from 'path';
import { HTMLHint } from 'htmlhint';
import colors from "picocolors";

import getFileIgnorer from "stylelint/lib/utils/getFileIgnorer";
import filterFilePaths from 'stylelint/lib/utils/filterFilePaths';
import getConfigForFile from './getConfigForFile';
import prepareReturnValue from './prepareReturnValue';
import classValue from './classValue';

const DEFAULT_IGNORE_FILENAME = '.htmlhintignore';

HTMLHint.addRule(classValue);

export function defaultFormat(results) {
  let output = '';
  results.forEach(result => {
    if (!result.warnings.length) return;
    const firstLineCol = result.warnings[0].line + ':' + result.warnings[0].col;
    output += `  ${colors.underline(result.relativeFilePath)}${colors.hidden(`:${firstLineCol}`)}\n`;
    const arrLogs = HTMLHint.format(result.warnings, {
        colors: true,
        indent: 2,
    });
    arrLogs.forEach((str) => {
      output += str + '\n';
    });
    output += '\n';
  })
  return output;
}

async function htmlhint({
	config,
	configBasedir,
	configFile,
	cwd = process.cwd(),
	files,
	formatter,
	globbyOptions,
	ignorePattern,
	maxWarnings,
}) {
	let ignorer;
	try {
		ignorer = getFileIgnorer({ cwd, ignorePath: DEFAULT_IGNORE_FILENAME, ignorePattern });
	} catch (error) {
		return Promise.reject(error);
	}

  if (!formatter) {
    formatter = defaultFormat;
  }

  if (!config) {
    try {
      getConfig = await getConfigForFile(configFile, configBasedir);
      config = getConfig.config;
    } catch (error) {
      return Promise.reject(error);
    }
  }


  let fileList = [files].flat().map((entry) => {
    const globCWD = (globbyOptions && globbyOptions.cwd) || cwd;
    const absolutePath = !path.isAbsolute(entry)
      ? path.join(globCWD, entry)
      : path.normalize(entry);

    if (fs.existsSync(absolutePath)) {
      // This path points to a file. Return an escaped path to avoid globbing
      return fastGlob.escapePath(normalizePath(entry));
    }

    return entry;
  });

  const effectiveGlobbyOptions = {
		cwd,
		...(globbyOptions || {}),
		absolute: true,
	};

	const globCWD = effectiveGlobbyOptions.cwd;

  let filePaths = await globby(fileList, effectiveGlobbyOptions);

	filePaths = filterFilePaths(
		ignorer,
		filePaths.map((p) => path.relative(globCWD, p)),
	);

	if (filePaths.length) {
		let absoluteFilePaths = filePaths.map((filePath) => {
			const absoluteFilepath = !path.isAbsolute(filePath)
				? path.join(globCWD, filePath)
				: path.normalize(filePath);

			return absoluteFilepath;
		});

		const getResults = absoluteFilePaths.map((absoluteFilepath) => {
			try {
        const dataRaw = fs.readFileSync(absoluteFilepath, 'utf8')
        return {
          filePath: absoluteFilepath,
					relativeFilePath: path.relative(globCWD, absoluteFilepath),
          warnings: HTMLHint.verify(dataRaw, config)
        }
			} catch (error) {
        console.log(error);
			}
		});

    const result = prepareReturnValue(getResults, maxWarnings, formatter, cwd);
    return result;
	}
}


export default htmlhint;