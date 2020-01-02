const effects = require('./effects.js');
const settings = require('./settings.js');
const Discord = require('discord.js');
const ids = require('./id.json');
const ytdl = require('ytdl-core');
const auth = require('./auth.json');
const fs = require('fs');

const selfID = ids.selfID;
const quantumID = ids.quantumID;
const briID = ids.briID;
const retracksID = ids.retracksID;
const devChannelID = ids.devChannelID;
const bebeID = ids.bebeID;
const prefix = '?';
const queue = new Map();
const client = new Discord.Client();

var isBotAllowed = false;
var isBreak = false;
var blacklistRetracks = false;
var effectsChannel;

function setBreak(freezeStatus) {
	isBreak = freezeStatus;
	if (isBreak) {
		return "I shall go do one sleeps";
	}
	return "Am woke aha";
}

// Unhandled guarantee: minWords must at least be 2
function getWord(words, index, preserveCase = false) {
	if (words.length <= index)
		return "0";

	if (preserveCase)
		return words[index];

	return words[index].toLowerCase();
}

function isAdmin(userID) {
	return (userID == quantumID || userID == briID);
}

function isDev(userID) {
	return (userID == quantumID);
}

function isOperator(userID) {
	return (isAdmin(userID) || userID == bebeID);
}

function assignSetting(key, defVal) {
	setting = settings.get(key);

	if (!setting)
		return defVal;

	return setting;
}

function assignSettings(key, defVal) {
	isBotAllowed = assignSetting("botAllowed", false);
	blacklistRetracks = assignSetting("blr", false);
}

client.once('ready', () => {
	effectsChannel = client.channels.get(ids.effectsChannelID);
	effects.readEffectsFromFile();
	effects.cacheAllEffects();
	settings.readSettingsFromFile();
	assignSettings();
	console.log('Ready!');
});

client.once('reconnecting', () => {
	console.log('Reconnecting!');
});

client.once('disconnect', () => {
	console.log('Disconnect!');
});

client.on('message', async message => {

	// On-demand restriction for accidental issues
	// May be used as spam-protection
	if (!isAdmin(message.author.id) && isBreak) {
		return;
	}

	// Bots aren't allowed to execute commands (by default)
	// Only admins should be able to modify bot allowance
	if (message.author.bot && !isBotAllowed)
		return;

	// Only respond to the prefix with content
	if (!message.content.startsWith(prefix) && message.content.length > 1)
		return;

	const serverQueue = queue.get(message.guild.id);

	/*
	 * 1) Strip the ? prefix from the message
	 * 2) Clean extra whitespaces
	 * 3) Break words at whitespaces
	 * 4) Take the first word
	 * 5) Convert to lowercase and assign as command
	 */
	words = message.content
			.substr(1, message.content.length)
			.replace(/\s+/g, " ")
			.split(' ');

	command = words[0].toLowerCase();

	switch (command) {
		// Bot management commands
		case "stop":
			stop(message, serverQueue, 0);
			break;

		case "disconnect":
			stop(message, serverQueue, 1);
			break;

		case "skip":
			skip(message, serverQueue);
			break;

		case "freeze":
			if (isDev(message.author.id))
				message.channel.send(setBreak(true));
			else
				message.channel.send("This command is in the vault, needs dev access");
			break;

		case "thaw":
			if (!isBreak)
				message.channel.send("I'm already woke my guy");
			else if (isAdmin(message.author.id))
				message.channel.send(setBreak(false));
			else
				message.channel.send("This command needs admin access");
			break;

		// Effects CRUD operations
		case "delete":
			if (isOperator(message.author.id)) {
				effects.remove(getWord(words, 2, 1));
			}
			break;

		case "add":
			if (isOperator(message.author.id)) {
				effects.add(getWord(words, 1), getWord(words, 2, true))
			}
			break;

		case "cache":
		case "forcecache":
			if (isOperator(message.author.id)) {
				message.channel.send(effects.cache(getWord(words, 1), true, command == "forcecache"));
			}
			break;

		case "commiteffects":
			if (isOperator(message.author.id))
				message.channel.send(effects.commit());
			break;

		case "get":
			url = effects.getURL(getWord(words, 1));
			if (!url)
				message.channel.send("The effect isn't on record");
			else
				message.channel.send(words[1] + ": <" + url + ">");
			break;

		case "listall":
			message.channel.send(effects.getNames());
			return;

		// The effects themselves
		default:
			if (!command)
				return;

			url = effects.getURL(command);

			if (!url) {
				message.channel.send(command + " command doesn't exist mate");
				return;
			}
			execute(command, url, message, serverQueue);
	}
});

async function execute(command, url, message, serverQueue) {
	const voiceChannel = message.member.voiceChannel;

	if (!voiceChannel)
		return message.author.send('You need to be in a voice channel to play music!');

	const permissions = voiceChannel.permissionsFor(message.client.user);

	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return message.channel.send('I need the permissions to join and speak in your voice channel!');
	}

	effectsChannel.send(message.content.substr(1, message.content.len) + ` requested by ` + message.author.id);

	if (!serverQueue) {
		const queueContruct = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true,
		};

		queue.set(message.guild.id, queueContruct);

		queueContruct.songs.push([command, url]);

		try {
			var connection = await voiceChannel.join();
			queueContruct.connection = connection;
			play(message.guild, queueContruct.songs[0]);
		} catch (err) {
			console.log(err);
			queue.delete(message.guild.id);
			return;
		}
	} else {
		serverQueue.songs.push([command, url]);
		return;
	}

}

function skip(message, serverQueue) {
	if (!message.member.voiceChannel) return message.channel.send('You have to be in a voice channel to stop the music!');
	if (!serverQueue) return message.channel.send('There is no song that I could skip!');
	serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue, shouldDisconnect) {
	if (!message.member.voiceChannel && !isAdmin(message.author.id))
		return message.channel.send('You have to be in a voice channel to stop the music!');

	serverQueue.songs = [];
	serverQueue.connection.dispatcher.end();

	if (shouldDisconnect) {
		serverQueue.voiceChannel.leave();
	}
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}

	if (effects.isCached(song[0])) {
		stream = fs.createReadStream("./vid_cache/" + song[0]);
	} else {
		stream = ytdl(song[1], {quality: 'lowest'});
	}

	const dispatcher = serverQueue.connection.playStream(stream)
	.on('end', () => {
			console.log('Music ended!');
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
	.on('error', error => {
			console.error(error);
			stream.close();
		});
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

}

client.login(auth.token);