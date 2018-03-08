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
const bot = new Discord.Client();

bot.on('ready', function (evt) {
  logger.info('Logged in as: ' + bot.user);
  const fp = new ForumPosts(bot);
  fp.checkMessages();
});

// Automatically reconnect if the bot disconnects due to inactivity
bot.on('disconnect', (erMsg, code) => {
    bot.connect();
});

// Respones
bot.on('message', responses.bind(bot));

/* LOGIN */
bot.login(auth.token);


