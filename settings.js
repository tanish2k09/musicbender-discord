/* This file is responsible for handling the effects map
 * and that includes reading, writing, updating and removing any effects.
 *
 * NOTE: Only admins must be able to use REST operations on the effects map.
 */
const fs = require('fs');

var settings = {};

function stringify() {
	out = "{\n\t\"configs\" : [";
	isInit = true;
	for (key in settings) {
		if (!isInit)
			out += ",";

		out += "\n\t\t{\n\t\t\t\"key\" : \"" + key + "\",";
		out += "\n\t\t\t\"val\" : \"" + settings[key] + "\"\n\t\t}"
		isInit = false;
	}
	out += "\n\t]\n}";
	return out;
}

module.exports = {
	
	readSettingsFromFile: function () {
		settingsList = JSON.parse(fs.readFileSync('./settings.json'));
		for (var i = 0; i < settingsList.configs.length; ++i) {
			setting = settingsList.configs[i];
			settings[setting.key] = setting.val;
		}
	},

	get: function (key) {
		return settings[key];
	},

	getSettings: function () {
		sortedList = [];
		for (key in settings) {
			sortedList[sortedList.length] = key;
		}

		out = "```\n";
		sortedList.sort();

		for (i = 0; i < sortedList.length; ++i) {
			out += sortedList[i] + " = " + settings[sortedList[i]] + '\n';
		}

		return out + "```";
	},

	set: function (key, value) {
		settings[key] = value;
	},

	toggle: function (key) {
		settings[key] = !settings[key];
	},

	commit: function () {
		try {
			fs.renameSync('./settings.json', './settings.json.bk');
			fs.writeFileSync('./settings.json', stringify());
			return "Settings committed successfully";
		} catch (err) {
			console.log(err);
			return "Something went wrong while committing settings, flushed log";
		}
	}
}
