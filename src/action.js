const path = require("path");
const core = require("@actions/core");
const {
	downloadPulsar,
	addToPath,
	printVersions,
} = require("./setup-pulsar.js");

async function run() {
	try {
		const version = core.getInput("version").toLowerCase() || "stable";
		const token = core.getInput("token") || "";
		const folder = path.resolve(process.env.RUNNER_TEMP, "pulsar");
		core.info(`version: ${version}`);
		core.info(`folder: ${folder}`);

		await downloadPulsar(version, folder, token);
		await addToPath(version, folder);
		await printVersions();

	} catch (error) {
		core.setFailed(error.message);
	}
}

run();
