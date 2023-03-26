const path = require("path");
const tc = require("@actions/tool-cache");
const core = require("@actions/core");
const {exec} = require("@actions/exec");
const { Octokit } = require("@octokit/rest");
const {promisify} = require("util");
const cp = require("child_process");
const execAsync = promisify(cp.exec);
const fs = require("fs");
const writeFileAsync = promisify(fs.writeFile);
const os = require("os");

const CHANNELS = [
	"beta",
];

const INVALID_CHANNELS = [
	"nightly",
	"dev",
	"stable",
];

async function downloadPulsar(version, folder, token) {
	if (typeof version !== "string") {
		version = "stable";
	}
	if (typeof folder !== "string") {
		folder = path.resolve(process.env.RUNNER_TEMP, "./pulsar-edit");
	}
	if (typeof token !== "string") {
		token = "";
	}
	const url = await findUrl(version, token);
	core.debug(`Downloading ${url}`);
	switch (process.platform) {
		case "win32": {
			const downloadFile = await tc.downloadTool(url);
			await tc.extractZip(downloadFile, folder);
			break;
		}
		case "darwin": {
			const downloadFile = await tc.downloadTool(url);
			await tc.extractZip(downloadFile, folder);
			break;
		}
		default: {
			const downloadFile = await tc.downloadTool(url);
			await exec("dpkg-deb", ["-x", downloadFile, folder]);
			break;
		}
	}
}

async function addToPath(version, folder) {
	switch (process.platform) {
		case "win32": {
			// TODO: handle naming differences post GA
			const pulsarPath = path.join(folder, "Pulsar", "resources", "cli");
			core.debug(`Adding ${pulsarPath} to the PATH`);
			core.addPath(pulsarPath);
			break;
		}
		case "darwin": {
			// TODO: handle naming differences post GA
			const pulsarPath = path.join(folder, "Pulsar.app", "Contents", "Resources", "app");
			const ppmPath = path.join(pulsarPath, "ppm", "bin");
			core.debug(`Adding ${pulsarPath} and ${ppmPath} to the PATH`);
			core.addPath(pulsarPath);
			core.addPath(ppmPath);
			break;
		}
		default: {
			// TODO: handle naming differences post GA
			const display = ":99";
			await exec(`/sbin/start-stop-daemon --start --quiet --pidfile /tmp/custom_xvfb_99.pid --make-pidfile --background --exec /usr/bin/Xvfb -- ${display} -ac -screen 0 1280x1024x16 +extension RANDR`);
			const pulsarPath = path.join(folder, "usr", "share", "Pulsar");
			const ppmPath = path.join(pulsarPath, "resources", "app", "ppm", "bin");
			core.debug(`Adding ${pulsarPath} and ${ppmPath} to the PATH`);
			await core.exportVariable("DISPLAY", display);
			core.addPath(pulsarPath);
			core.addPath(ppmPath);
			break;
		}
	}
}

async function printVersions() {
	try {
		core.info((await execAsync("pulsar -v")).stdout);
		core.info((await execAsync("ppm -v")).stdout);
	} catch(e) {
		core.warning("Error printing versions:", e);
		core.warning(e.message);
		core.warning(e.stack);
	}
}

async function findUrl(version, token) {
	let tag = version;
	if (INVALID_CHANNELS.includes(version)) {
		throw new Error(`'${version}' is not a valid version.`);
	}
	if (CHANNELS.includes(version)) {
		const octokit = new Octokit({auth: token});
		const {data: releases} = await octokit.rest.repos.listReleases({
			owner: "pulsar-edit",
			repo: "pulsar",
			per_page: 100,
		});
		let release;
		if (version === "stable") { // leaving stable as it will be a thing
			release = releases.find(r => !r.draft && !r.prerelease);
		} else {
			release = releases.find(r => !r.draft && r.prerelease && r.tag_name.includes(version));
		}
		if (release) {
			tag = release.tag_name;
			version = release.tag_name.replace("v", "");
		}
	}

	switch (process.platform) {
		case "win32": {
			// Windows.Pulsar.1.101.0-beta.exe
			return `https://github.com/pulsar-edit/pulsar/releases/download/${tag}/Windows.Pulsar.${version}.exe`;
		}
		case "darwin": {
			// Silicon.Mac.Pulsar-1.101.0-beta-arm64-mac.zip or Intel.Mac.Pulsar-1.101.0-beta-mac.zip
			const filename = os.arch() === "arm64" ? `Silicon.Mac.Pulsar-${version}-arm64-mac` : `Intel.Mac.Pulsar-${version}-mac`;
			return `https://github.com/pulsar-edit/pulsar/releases/download/${tag}/${filename}.zip`;
		}
		default: {
			// ARM.Linux.pulsar_1.101.0-beta_arm64.deb or Linux.pulsar_1.101.0-beta_amd64.deb
			const filename = os.arch() === "arm64" ? `ARM.Linux.pulsar_${version}_arm64` : `Linux.pulsar_${version}_amd64`;
			return `https://github.com/pulsar-edit/pulsar/releases/download/${tag}/${filename}.deb`;
		}
	}
}

module.exports = {
	downloadPulsar,
	addToPath,
	printVersions,
	findUrl,
};
