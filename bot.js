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
  if (user.bot) return; //Ignore's own messages
  var content = message.content;
  var channelID = message.channel.id;
  var mentions = Array.from(message.mentions.users.keys());

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
        if (mentions.length > 0) {
          bot.channels.get(channelID).send("I'm not in charge of banning players");
          break;
        }
      case 'whyban':
        if (mentions.length > 0)
          bot.channels.get(channelID).send("Player's aren't cards, silly");
        else 
          bot.channels.get(channelID).send(whyban(args));
        break;
      case 'banlist':
        bot.channels.get(channelID).send(banlist());
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

  if (checkSass(content, channelID)) return;
  
  checkMentions(mentions, channelID);

});

/* LOGIN */
bot.login(auth.token);

// Helper Functions
function reload(module) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

function rndrsp(items) {
  return items[Math.floor(Math.random()*items.length)];
}

function cleantext(string) {
  //strip comma and apostrophy
  return string.toLowerCase().replace(/,|\'/g, '');
}

// Responses
function banlist() {
  var bans = reload('./config/bans.json');
  var message = "This is our player-made ban list:\n====="
  for (var key in bans) {
    message += "\n" + key;
  }
  message += "\n=====\nYou can ask me why a card was banned with \"!whyban <card name>\""
  return message;
}

function whyban(card, mentions) {
  var bans = reload('./config/bans.json');
  card = cleantext(card.join(" ")); // remerge string

  if (card == "") {
    return rndrsp(["Specify a card...", "Yeah, just ban *everything*"]);
  }

  for (var key in bans) {
    if (cleantext(key).indexOf(card) == 0) {           
      return `*${key}* was banned because:\n${rndrsp(bans[key])}`;
    }
  }

  return rndrsp(["That card isn't banned. :D", `Oh lucky you, ${card} isn't banned`]);
}

function ruling(rule) {
  var rules = reload('./config/rules.json');
  var sass = reload('./config/sass.json');

  if (rule == "") {
    return rndrsp(sass["!providerule"]);
  }

  if (rules.hasOwnProperty(rule)) {           
    return `${rules[rule]}`;
  }

  return rndrsp(sass["!norule"]);
}

function checkSass(content, channelID) {
  var sass = reload('./config/sass.json');
  
  for (var key in sass) {
    var query = new RegExp(key, "i");
    if (content.match(query)) {
      bot.channels.get(channelID).send(rndrsp(sass[key]));
      return true;
    }
  }
  return false;
}

function checkMentions(mentions, channelID) {
  if (mentions.length <= 0) return;
  var sass = reload('./config/sass.json');

  // if (mentions.indexOf('140143063711481856') !== -1)
  if (mentions.indexOf('279331985955094529') !== -1)
    bot.channels.get(channelID).send(rndrsp(sass["!hello"]));

  if (mentions.indexOf('279788856285331457') !== -1)
    bot.channels.get(channelID).send('Don\'t @ the Oracle. He sees everything anyway')
}
