var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var checkMessages = require('./forum_posts');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
  colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client();

bot.on('ready', function (evt) {
  logger.info('Logged in as: ' + bot.user);
  checkMessages();
});

// Automatically reconnect if the bot disconnects due to inactivity
bot.on('disconnect', function(erMsg, code) {
    bot.connect();
});
bot.on('message', (message) => {
  var user = message.author;
  var content = message.content;
  var channelID = message.channel.id;

  if (user.bot) return; //Ignore's own messages

  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with `!`
  if (content.substring(0, 1) == '!') {
    var args = content.substring(1).split(' ');
    var cmd = args[0].toLowerCase();
     
    args = args.splice(1);

    switch(cmd) {
      case 'ping':
        message.reply('Pong!');
        break;
      case 'pong':
        bot.channels.get(channelID).send('That\'s my role...');
        break;
      case 'ban':
      case 'whyban':
        bot.channels.get(channelID).send(whyban(args));
        break;
      case 'rule':
      case 'rules':
      case 'ruling':
        bot.channels.get(channelID).send(ruling(args));
        break;
      case 'endofturn':
        bot.channels.get(channelID).send(ruling('6.4.1'));
        break;
    }
    return;
  }
   
  if (content.match(/.*(chaotic).*(com|be).*(back).*/i))
    bot.channels.get(channelID).send('any day now');

  if (content.toLowerCase().includes("any day now?"))
    bot.channels.get(channelID).send('***ANY*** day now');

  if (content.toLowerCase().includes("rule 34"))
    bot.channels.get(channelID).send('not on this server we don\'t');
   
  var mentions = Array.from(message.mentions.users.keys());

  // if (mentions.indexOf('140143063711481856') !== -1)
  if (mentions.indexOf('279788856285331457') !== -1)
    bot.channels.get(channelID).send('Don\'t @ the Oracle. He sees everything anyway')

});

/* LOGIN */
bot.login(auth.token);


function cleantext(string) {
  //strip comma and apostrophy
  return string.toLowerCase().replace(/,|\'/g, '');
}

function whyban(card) {
  var bans = reload('./config/bans.json');
  card = cleantext(card.join(" ")); // remerge string

  if (card == "") {
    return "Specify a card...";
  }

  for (var key in bans) {
    if (cleantext(key).indexOf(card) == 0) {           
      return `*${key}* was banned because:\n${bans[key]}`;
    }
  }

  return "That card isn't banned. :D"

}

function banlist() {

}

function ruling(rule) {
  var rules = reload('./config/rules.json');

  if (rule == "" || rule == "0.0.0") {
    return "Rule 0.0.0. Provide the bot a rule";
  }

  if (rules.hasOwnProperty(rule)) {           
    return `${rules[rule]}`;
  }

  return "Sorry I don't have that rule memorized. " +
    "You can check the Comprehensive Rules:\nhttps://drive.google.com/drive/folders/0B6oyUfwoM3u1bUhEcEhHalFiWTA";
}

function reload(module) {
  delete require.cache[require.resolve(module)];
  return require(module);
}
