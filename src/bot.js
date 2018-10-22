require('babel-polyfill');
const Discord = require('discord.js');
const logger = require('winston');
var auth = require('./auth.json');
var ForumPosts = require('./js/posts.js');
var responses = require('./js/responses.js');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
  colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
const bot = new Discord.Client({autoReconnect: true});

bot.on('ready', function (evt) {
  logger.info('Logged in as: ' + bot.user);
  bot.user.setActivity('!commands')
  const fp = new ForumPosts(bot);
  fp.checkMessages();
});

// Automatically reconnect if the bot disconnects due to inactivity
bot.on('disconnect', (erMsg, code) => {
	logger.info('Reconnecting');
  bot.login(auth.token);
});

// Respones
bot.on('message', responses.bind(bot));

// Ban Spam
bot.on('guildMemberAdd', (member) => {
	if (member.displayName.match(new RegExp("(discord\.me)|(discord\.gg)|(bit\.ly)|(twitch\.tv)", "i"))) {
		if (member.bannable) {
			member.ban(); 
			logger.info('Banned: ' + member.displayName);
			// Delete the welcome message
			let meebot = bot.users.find(user => user.id == 159985870458322944);
			if (meebot && meebot.lastMessage && meebot.lastMessage.deletable) meebot.lastMessage.delete();
		}
	}
});

/* LOGIN */
bot.login(auth.token);


