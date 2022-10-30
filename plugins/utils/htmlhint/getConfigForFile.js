import { cosmiconfig } from 'cosmiconfig';

async function getConfigForFile(
  configFile,
  searchPath = process.cwd(),
) {
	const configExplorer = cosmiconfig('htmlhint');

	let config = configFile
		? await configExplorer.load(configFile)
		: await configExplorer.search(searchPath);

	if (!config) {
		config = await configExplorer.search(process.cwd());
	}

	if (!config) {
		return Promise.reject(`No configuration provided`);
	}

	return config;
}

export default getConfigForFile;