require('babel-polyfill');
const Discord = require('discord.js');
const winston = require('winston');
const auth = require('./auth.json');
const ForumPosts = require('./js/forum.js');
const responses = require('./js/responses.js');

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

// Initialize Discord Bot
const bot = new Discord.Client({autoReconnect: true});
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
bot.on('message', responses.bind(bot));

// Ban Spam
bot.on('guildMemberAdd', (member) => {
	if (member.displayName.match(new RegExp("(discord\.me)|(discord\.gg)|(bit\.ly)|(twitch\.tv)|(twitter\.com)", "i"))) {
		if (member.bannable) member.ban().then((err) => {
			logger.info('Banned: ' + member.displayName);
			// Delete the welcome message
			let meebot = bot.users.get('159985870458322944');
			if (meebot) setTimeout(() => {
				if (meebot.lastMessage && meebot.lastMessage.deletable) meebot.lastMessage.delete();
			}, 500);
		}); 
	}
});

/* LOGIN */
bot.login(auth.token);

process.on('unhandledRejection', logger.error);
