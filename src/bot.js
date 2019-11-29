require('@babel/polyfill/noConflict');
import winston from 'winston';
import Discord, {Status} from 'discord.js';

import responses from './responses';
import ForumAPI from './forum_api';
import ForumPosts from './forum_posts';
import ScanQuest from './scanquest';

const auth = require('./auth.json');
const {servers} = require('./config/server_ids.json');

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
const sq = new ScanQuest(bot);

let main = false;
// Disabled freatures if api.json is missing or set to false
if (process.env.NODE_ENV !== "development") {
	try {
		const api = require('./api.json');
		if (api != false) main = true;
	}
	catch (e) {	}
}

if (main) {
	ForumAPI(logger);
}

bot.on('ready', () => {
	bot.user.setActivity('!commands');

	if (main) {
		fp.start();
		sq.start();
	}

});

// Automatically reconnect if the bot disconnects
bot.on('disconnect', (CloseEvent) => {
	fp.stop();
	sq.stop();
	logger.warn('Reconnecting, ' + CloseEvent.code);
	bot.login(auth.token).then(() => {sendError()});
});

let stackTrace = "";
function sendError() {
	if (stackTrace) {
		logger.error(stackTrace);
		let channel = bot.channels.get(servers.develop.channels.errors);
		if (channel) channel.send(stackTrace).catch(logger.error);
		stackTrace = "";
	}
}

// Responses
bot.on('message', msg => responses.call(bot, msg, logger));

// Ban Spam
bot.on('guildMemberAdd', (member) => {
	if (member.displayName.match(new RegExp("(quasar$)|(discord\.me)|(discord\.gg)|(bit\.ly)|(twitch\.tv)|(twitter\.com)", "i"))) {
		if (member.bannable) member.ban().then(() => {
			logger.warn('Banned: ' + member.displayName);
			bot.channels.get(servers.main.channels.staff).send('Banned: ' + member.displayName);
			// Delete the welcome message
			let meebot = bot.users.get('159985870458322944');
			if (meebot) setTimeout(() => {
				if (meebot.lastMessage && meebot.lastMessage.deletable) meebot.lastMessage.delete();
			}, 500);
		});
	}
});

process.on('unhandledRejection', (err) => {
	stackTrace = (err && err.stack) ? err.stack : err;
	if (bot.status === Status.READY) sendError();
	else bot.destroy();
});

/* LOGIN */
bot.login(auth.token).then(() => {
	logger.info('Logged in as: ' + bot.user);
});
// bot.login(auth.token).then(() => {throw new Error()});
