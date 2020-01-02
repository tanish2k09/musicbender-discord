/* This file is responsible for handling the effects map
 * and that includes reading, writing, updating and removing any effects.
 *
 * NOTE: Only admins must be able to use REST operations on the effects map.
 */
const fs = require('fs');

var settings = {};

module.exports = {
	
	readSettingsFromFile: function () {
		settingsList = JSON.parse(fs.readFileSync('./settings.json'));
		for (var i = 0; i < settingsList.configs.length; ++i) {
			setting = settingsList.configs[i];
			settings[setting.key] = setting.value;
		}
	},

	get: function (key) {
		return settings[key];
	}
}
