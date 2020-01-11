const effects = require('./helpers/effects.js');
const settings = require('./helpers/settings.js');
const Discord = require('discord.js');
const ids = require('./JSON/id.json');
const ytdl = require('ytdl-core');
const auth = require('./JSON/auth.json');
const fs = require('fs');

const selfID = ids.self;
const quantumID = ids.quantum;
const briID = ids.bri;
const retracksID = ids.retracks;
const bebeID = ids.bebe;
const prefix = '?';
const client = new Discord.Client();
const alphaNum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

var isBreak = false;
var effectsChannel;
var historyChannel;
var devChannel;
var timer = null;
var wasIdle = true;
var shutdownKey = null;
var dispatcher;
var queue = [];
var legalTimeout = true;

function setBreak(freezeStatus) {
	isBreak = freezeStatus;
	if (isBreak) {
		return "I shall go do one sleeps";
	}
	return "Am woke aha";
}

function getWord(words, index, preserveCase = false) {
	if (words.length <= index)
		return "0";

	if (preserveCase)
		return words[index];

	return words[index].toLowerCase();
}

function isAdmin(userID) {
	return (isDev(userID) || userID == briID);
}

function isDev(userID) {
	return (userID == quantumID);
}

function isOperator(userID) {
	return (isAdmin(userID) || userID == bebeID);
}

function isHydraChannel(channelID) {
	return channelID == ids.hydraChannelID;
}

function generateShutdownKey(len) {
	var key = '';
	for ( var i = 0; i < 62; i++ ) {
		key += alphaNum.charAt(Math.floor(Math.random() * 62));
	}
	return key;
}

function setShutdownKey(create) {
	if (create)
		shutdownKey = generateShutdownKey(64);
	else
		shutdownKey = null;
}

client.once('ready', () => {
	effectsChannel = client.channels.get(ids.effectsChannel);
	historyChannel = client.channels.get(ids.historyChannel);
	devChannel = client.channels.get(ids.devChannel);
	effects.readEffectsFromFile();
	effects.cacheAllEffects();
	settings.readSettingsFromFile();
	devChannel.send("Rebooted and resuited!");
	console.log('Ready!');
});

client.once('reconnecting', () => {
	console.log('Reconnecting!');
});

client.once('disconnect', () => {
	console.log('Disconnect!');
});

client.on('message', async message => {

	// Don't respond to messages authored by the bot itself
	if (message.author.id == selfID)
		return;

	// On-demand restriction for accidental issues
	// May be used as spam-protection
	if (!isAdmin(message.author.id) && isBreak) {
		return;
	}

	// Bots aren't allowed to execute commands (by default)
	// Only admins should be able to modify bot allowance
	if (message.author.bot && !settings.get("iba"))
		return;

	if (message.author.id == retracksID && settings.get("blr"))
		return;

	// Only respond to the prefix with content
	// Unless hydra history setting is enabled, which doesn't require a prefix
	if (!message.content.startsWith(prefix) && message.content.length > 1) {
		if (isHydraChannel(message.channel.id) &&
			settings.get("hmh") &&
			!message.content.startsWith(settings.get("hp"))
		)
			historyChannel.send(message.content);
		return;
	}

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
		case "clear":
			if (isOperator(message.author.id))
				queue = [];
			return;

		case "shutdown":
			if(isDev(message.author.id)) {
				setShutdownKey(true);
				message.channel.send("Shutdown initiated, keygen built ||" + shutdownKey + "||");
			} else {
				message.channel.send("Don't play around, this command is in the dev vault");
			}
			return;

		case "proceedshutdown":
			if (!isDev(message.author.id)) {
				message.channel.send("Don't play around, this command is in the dev vault");
				return;
			}

			if (shutdownKey == null) {
				message.channel.send("Shutdown wasn't initiated... Aborting");
				return;
			}

			key = getWord(words, 1, true);
			if (key != shutdownKey) {
				message.channel.send("Invalid key provided... Shutdown cancelled");
				shutdownKey = null;
				return;
			}

			message.channel.send("Shutdown confirmed");
			client.destroy();
			return;

		case "disconnect":
			if (isAdmin(message.author.id))
				disconnect(message.guild.me.voiceChannel);
			return;

		case "skip":
			skip(message);
			return;

		case "freeze":
			if (isAdmin(message.author.id))
				message.channel.send(setBreak(true));
			else
				message.channel.send("This command need admin access");
			return;

		case "thaw":
			if (!isBreak)
				message.channel.send("I'm already woke my guy");
			else if (isAdmin(message.author.id))
				message.channel.send(setBreak(false));
			else
				message.channel.send("This command needs admin access");
			return;

		// Settings CRUD operations:
		case "iba":
		case "togglebotinteraction":
			if (isAdmin(message.author.id)) {
				settings.toggle("iba");
				message.channel.send("External bot interaction is now set to " + settings.get("iba"));
			} else {
				message.channel.send("This command needs admin access");
			}
			return;

		case "blr":
		case "toggleblr":
		case "blacklistretrack":
		case "blacklistretracks":
		case "blacklistretrack5":
			if (isAdmin(message.author.id)) {
				settings.toggle("blr");
				message.channel.send("Blocking retrack5 is now set to " + settings.get("blr"));
			} else {
				message.channel.send("This command needs admin access");
			}
			return;

		case "reqbverb":
		case "togglerv":
		case "togglereq":
		case "togglereqv":
		case "togglereqverbose":
			if (isOperator(message.author.id)) {
				settings.toggle("reqverb");
				message.channel.send("Requestor verbose is now set to " + settings.get("reqverb"));
			} else {
				message.channel.send("This command needs operator access");
			}
			return;

		case "settimeout":
		case "timer":
		case "timeout":
		case "idle":
			if (isDev(message.author.id)) {
				settings.set("timeout", getWord(words, 1));
				message.channel.send("Idle timeout is now set to " + settings.get("timeout"));
			} else {
				message.channel.send("This command needs dev access");
			}
			return;

		case "hmh":
		case "togglehmh":
		case "togglehistory":
		case "hydrahistory":
			if (isOperator(message.author.id)) {
				settings.set("hmh", getWord(words, 1))
				message.channel.send("Hydra history is now set to " + settings.get("hmh"));
			} else {
				message.channel.send("This command needs operator access");
			}
			return;

		case "hp":
		case "hydraprefix":
		case "hydrap":
		case "hprefix":
			if (isAdmin(message.author.id)) {
				settings.set("hp", getWord(words, 1))
				message.channel.send("Hydra history is now set to " + settings.get("hp"));
			} else {
				message.channel.send("This command needs admin access");
			}
			return;

		case "commits":
		case "commitsettings":
			if (isAdmin(message.author.id))
				message.channel.send(settings.commit());
			else
				message.channel.send("This command needs admin access");
			return;

		case "gets":
		case "getsetting":
			setting = settings.get(getWord(words, 1));
			if (!setting)
				message.channel.send("The setting isn't on record");
			else
				message.channel.send(words[1] + ": <" + setting + ">");
			return;

		case "lists":
		case "listset":
		case "listsettings":
			message.channel.send(settings.getSettings());
			return;


		// Effects CRUD operations:
		case "delete":
			if (isAdmin(message.author.id)) {
				effects.remove(getWord(words, 2, 1));
			}
			return;

		case "update":
			if (isOperator(message.author.id)) {
				message.channel.send(
					effects.update(getWord(words, 1), getWord(words, 2, true))
				);
			}
			return;

		case "add":
			if (isOperator(message.author.id)) {
				message.channel.send(
					effects.add(getWord(words, 1), getWord(words, 2, true))
				);
			}
			return;

		case "cache":
		case "forcecache":
			if (isOperator(message.author.id)) {
				message.channel.send(effects.cache(getWord(words, 1), true, command == "forcecache"));
			}
			return;

		case "cacheall":
		case "forcecacheall":
			if (isOperator(message.author.id)) {
				effects.cacheAllEffects(command == "forcecacheall");
				message.channel.send("Effects cached as audio formats to storage");
			} else {
				message.channel.send("This command needs operator access");
			}
			return;

		case "refreshcache":
			if (isAdmin(message.author.id))
				message.channel.send(effects.refreshCache());
			else
				message.channel.send("This command needs admin access");
			return;

		case "wipecache":
			if (isAdmin(message.author.id))
				message.channel.send(effects.clearCacheAll());
			else
				message.channel.send("This command needs admin access");
			return;


		case "commiteffects":
		case "commite":
			if (isOperator(message.author.id))
				message.channel.send(effects.commit());
			return;

		case "get":
		case "gete":
		case "geteffect":
			url = effects.getURL(getWord(words, 1));
			if (!url)
				message.channel.send("The effect isn't on record");
			else
				message.channel.send(words[1] + ": <" + url + ">");
			return;

		case "numeffects":
			message.channel.send(effects.getNumEffects() + " effects are currently stored in mem");
			return;

		case "listeffects":
		case "liste":
		case "list":
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
			execute(command, url, message);
	}
});

function handlePlay(voiceChannel) {
	try {
		console.log("Seeding play...");
		play(voiceChannel, queue.shift());
	} catch (err) {
		console.log(err);
		queue = [];
		endDispatch();
		return;
	}
}

function execute(command, url, message) {
	legalTimeout = true;
	const voiceChannel = message.member.voiceChannel;

	if (!voiceChannel)
		return message.author.send('You need to be in a voice channel to play music!');

	const permissions = voiceChannel.permissionsFor(message.client.user);

	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return message.channel.send('I need the permissions to join and speak in your voice channel!');
	}

	if (timer)
		clearTimeout(timer);

	if (settings.get("reqverb"))
		effectsChannel.send(message.content.substr(1, message.content.len) + ` requested by ` + message.author.id);

	/* We can use the length of the queue to know the status of playback
	 * First we'd wanna check the idle status
	 * If the bot is idling, the queue would be empty and there would be no activity
	 *
	 * If the bot isn't idling, the queue may or may not be empty
	 * If the queue isn't empty, the bot is probably playing something
	 * If the queue is empty, the bot is playing the last track
	 */
	queue.push([command, url]);

	if (wasIdle) {
		handlePlay(voiceChannel);
	}
}

function skip(message) {
	if (!message.member.voiceChannel)
		return message.author.send("You have to be in a voice channel to skip effects!");

	if (wasIdle)
		return message.channel.send("Nothing left to skip brahstoka");

	endDispatch();
}

function endDispatch() {
	console.log("Ending dispatch...");
	if (dispatcher)
		dispatcher.end();
}

function disconnect(voiceChannel) {
	if (!legalTimeout) {
		console.log("Illegal disconnect handled...");
		return;
	}

	legalTimeout = false;

	if (timer)
		clearTimeout(timer);

	console.log("Disconnecting VC...");

	queue = [];
	endDispatch();

	// Note: At this point wasIdle is expected to be set to true
	console.log("Leaving VC...");
	if (voiceChannel != undefined) {
		voiceChannel.leave();
		console.log("Left VC...");
	}
}

async function play(voiceChannel, song) {
	if (song == null) {
		wasIdle = true;
		console.log("Idling...");
		timer = setTimeout(disconnect, parseInt(settings.get("timeout"), 10) * 1000, voiceChannel);
		return;
	}

	wasIdle = false;

	console.log("Attempting to join VC...");
	connection = await voiceChannel.join();
	console.log("VC joined...");

	if (effects.isCached(song[0])) {
		console.log("Got a cache hit on effect: ", song[0]);
		stream = fs.createReadStream("./vid_cache/" + song[0]);
	} else {
		console.log("Got a cache miss on effect: ", song[0]);
		stream = ytdl(song[1], {quality: 'lowest'});
	}

	console.log("Dispatching...");
	dispatcher = connection.playStream(stream)
	.on('end', () => {
			console.log('Effect ended...');
			play(voiceChannel, queue.shift());
		})
	.on('error', error => {
			console.error(error);
			stream.close();
		});
	dispatcher.setVolumeLogarithmic(1);
}

client.login(auth.token);