/* This file is responsible for handling the effects map
 * and that includes reading, writing, updating and removing any effects.
 *
 * NOTE: Only admins must be able to use REST operations on the effects map.
 */
const fs = require('fs');
const ytdl = require('ytdl-core');

var urls = {};

function stringify() {
	out = "{\n\t\"effects\" : [";
	isInit = true;
	for (key in urls) {
		if (!isInit)
			out += ",";

		out += "\n\t\t{\n\t\t\t\"id\" : \"" + key + "\",";
		out += "\n\t\t\t\"url\" : \"" + urls[key] + "\"\n\t\t}"
		isInit = false;
	}
	out += "\n\t]\n}";
	return out;
}

module.exports = {

	readEffectsFromFile: function () {
		effectsList = JSON.parse(fs.readFileSync('./effects.json'));
		for (var i = 0; i < effectsList.effects.length; ++i) {
			effect = effectsList.effects[i];
			urls[effect.id] =  effect.url;
		}
	},

	isCached: function (name) {
		url = urls[name];

		if (!url) {
			return;
		}

		return fs.existsSync("./vid_cache/" + name);
	},

	cache: function (name, verbose, force) {
		url = urls[name];

		if (!url) {
			if (verbose)
				return "Can't cache untracked effects";
			return;
		}

		if (this.isCached(name) && !force) {
			return;
		}

		console.log("Downloading effect: " + key);

		ytdl(urls[key], {quality: 'lowestaudio'}).pipe(
			fs.createWriteStream("./vid_cache/" + name)
		);

		console.log("Downloaded...\n");

		if (verbose)
			return name + " successfully cached";
	},

	cacheAllEffects: function () {
		for (key in urls) {
			this.cache(key, false, false);
		}
	},

	getURL: function (name) {
		return urls[name];
	},

	getNames: function () {
		sortedList = [];
		for (name in urls) {
			sortedList[sortedList.length] = name;
		}

		out = "```\n";
		sortedList.sort();

		for (i = 0; i < sortedList.length; ++i) {
			out += sortedList[i] + '\n';
		}

		return out + "```";
	},

	getNumEffects: function () {
		return Object.keys(urls).length;
	},

	remove: function (name) {
		if (name != "0" && urls[name])
			urls.delete(name);
	},

	add: function (name, url) {
		if (name == "0" || url == "0")
			return "Invalid name or URL";

		if (urls[name])
			return "Effect already exists, use update command to change links";

		try {
			// Try to fetch ID to see if the video is valid
			console.log("\n==================");
			console.log("Fetching: ", url);
			ytdl.getURLVideoID(url);
			console.log("Fetched successfully");

			urls[name] = url;
			return "Added effect to RAM, use commiteffects to store permanently";
		} catch (err) {
			console.log("Fetching failed, dumping error output");
			console.log(err);
			return "Invalid/Inaccessible URL";
		}
	},

	commit: function () {
		try {
			fs.renameSync('./effects.json', './effects.json.bk');
			fs.writeFileSync('./effects.json', stringify());
			return "Effects committed successfully";
		} catch (err) {
			console.log(err);
			return "Something went wrong while committing effects, flushed log";
		}
	}
}
