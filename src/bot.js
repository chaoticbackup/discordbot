const winston = require('winston');
const auth = require('./auth.json');
const responses = require('./_responses.js');

import API from './api.js';
import {Client} from 'discord.js';
import ForumPosts from './js/forum.js';
import {channels} from './config/server_ids.json';

// Configure logger settings
const logger = winston.createLogger({
	level: 'debug',
	format: winston.format.combine(
		winston.format.colorize(),
		winston.format.simple()
	),
	transports: [
		new winston.transports.Console()
	]
});

// Initialize the API
API(logger);

// Initialize Discord Bot
const bot = new Client({autoReconnect: true});
const fp = new ForumPosts(bot);

bot.on('ready', function (evt) {
	logger.info('Logged in as: ' + bot.user);
	bot.user.setActivity('!commands');
	fp.checkMessages();
});

// Automatically reconnect if the bot disconnects due to inactivity
bot.on('disconnect', (erMsg, code) => {
	logger.warn('Reconnecting');
 	bot.login(auth.token);
});

// Respones
bot.on('message', msg => responses.call(bot, msg, logger));

// Ban Spam
bot.on('guildMemberAdd', (member) => {
	if (member.displayName.match(new RegExp("(quasar$)|(discord\.me)|(discord\.gg)|(bit\.ly)|(twitch\.tv)|(twitter\.com)", "i"))) {
		if (member.bannable) member.ban().then((err) => {
			logger.warn('Banned: ' + member.displayName);
			bot.channels.get(channels.staff).send('Banned: ' + member.displayName);
			// Delete the welcome message
			let meebot = bot.users.get('159985870458322944');
			if (meebot) setTimeout(() => {
				if (meebot.lastMessage && meebot.lastMessage.deletable) meebot.lastMessage.delete();
			}, 500);
		});
	}
});

process.on('unhandledRejection', (err) => {
	logger.error(err);
	bot.destroy().then(() => {
		const t_bot = new Discord.Client();
		if (!t_bot.channels.get(channels.errors)) return;
		t_bot.channels.get(channels.errors).send(err.stack).catch(logger.error);
		t_bot.destroy();
	});
});

/* LOGIN */
bot.login(auth.token);
