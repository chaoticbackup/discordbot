require('@babel/polyfill/noConflict');
import winston from 'winston';
import Discord from 'discord.js';

import responses from './responses';
import ForumAPI from './forum/api';
import ForumPosts from './forum/posts';
import ScanQuest from './scanquest/scanquest';

import servers from './common/servers';
import { Channel } from './definitions';

const auth = require('./auth.json');

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

// Initialize Discord Bot and server components
const bot = new Discord.Client();
const fp = new ForumPosts(bot);
const sq = ScanQuest.init(bot, logger);

let main = false;
// Disabled freatures if api.json is missing or set to false
if (process.env.NODE_ENV !== "development") {
	try {
		const api = require('./api.json');
		if (api != false) {
			main = true;
			ForumAPI(logger);
		}
	}
	catch (e) { }
}
else if (process.env.APP_ENV === "test") {
	main = true;
}

bot.on('ready', () => {
	if (main) {
		fp.start();
		sq.start();
	}
	bot.user.setActivity('!commands');
});

// Automatically reconnect if the bot disconnects
bot.on('disconnect', (CloseEvent) => {
	if (main) {
		fp.stop();
		sq.stop();
	}
	logger.warn('Reconnecting, ' + CloseEvent.code);
	bot.login(auth.token).then(() => {sendError()});
});

let stackTrace = "";
const sendError = () => {
	if (stackTrace) {
		logger.error(stackTrace);
		if (process.env.NODE_ENV !== "development") {
			let channel = bot.channels.get(servers("develop").channel("errors"));
			if (channel) {
				(channel as Channel).send(stackTrace).catch(logger.error);
			}
		}
		stackTrace = "";
	}
}

// Responses
bot.on('message', msg => {
	responses.call(bot, msg, logger);
	ScanQuest.monitor(msg);
});

// Ban Spam
bot.on('guildMemberAdd', (member) => {
	if (member.displayName.match(new RegExp("(quasar$)|(discord\.me)|(discord\.gg)|(bit\.ly)|(twitch\.tv)|(twitter\.com)", "i"))) {
		if (member.bannable) member.ban().then(() => {
			// @ts-ignore
			bot.channels.get(servers("main").channel("staff")).send('Banned: ' + member.displayName);
			// Delete the meebot welcome message
			let meebot = bot.users.get('159985870458322944');
			if (meebot) setTimeout(() => {
				if (meebot!.lastMessage && meebot!.lastMessage.deletable) {
					meebot!.lastMessage.delete();
				}
			}, 500);
		});
	}
});

process.on('unhandledRejection', (err) => {
	// @ts-ignore
	stackTrace = (err && err.stack) ? err.stack : err;
	// Status.READY
	if (bot.status === 0) sendError();
	else bot.destroy();
});

/* LOGIN */
bot.login(auth.token).then(() => {
	logger.info('Logged in as: ' + bot.user);
});
// bot.login(auth.token).then(() => {throw new Error()});
