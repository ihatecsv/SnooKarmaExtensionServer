const fs = require("fs");
const path = require("path");

const configLocation = "./config.json";
const configDefaultLocation = "./config-defaults.json";

let config = {};

if (fs.existsSync(configLocation)) {
	config = JSON.parse(fs.readFileSync(configLocation, "utf8"));
} else {
	config = JSON.parse(fs.readFileSync(configDefaultLocation, "utf8"));
	fs.writeFile(configLocation, JSON.stringify(config, null, "\t"), function (err) {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		console.log(configLocation + " created! Please modify this before restarting the server.");
		process.exit(0);
	});
}

config.serverLocation = path.dirname(require.main.filename);

module.exports = config;