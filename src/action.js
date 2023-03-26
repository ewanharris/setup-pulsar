const path = require("path");
if (!process.env.GITHUB_ACTIONS) {
	if (process.env.USERPROFILE) {
		process.env.RUNNER_TEMP = path.resolve(process.env.USERPROFILE, "./temp");
	} else if (process.env.HOME) {
		process.env.RUNNER_TEMP = path.resolve(process.env.HOME, "./temp");
	} else {
		process.env.RUNNER_TEMP = path.resolve("../temp");
	}
}
const core = require("@actions/core");
const {
	downloadPulsar,
	addToPath,
	printVersions,
} = require("./setup-pulsar.js");

async function run() {
	try {
		const version = (process.env.GITHUB_ACTIONS && core.getInput("version").toLowerCase()) || process.argv[2] || "stable";
		const token = (process.env.GITHUB_ACTIONS && core.getInput("token")) || process.argv[3] || "";
		const folder = path.resolve(process.env.RUNNER_TEMP, process.argv[4] || "./pulsar");
		core.info(`version: ${version}`);
		core.info(`folder: ${folder}`);

		await downloadPulsar(version, folder, token);
		await addToPath(version, folder);
		await printVersions();

	} catch (error) {
		if (process.env.GITHUB_ACTIONS) {
			core.setFailed(error.message);
		} else {
			core.error(error);
			process.exit(1);
		}
	}
}

run();
