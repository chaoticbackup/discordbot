const {reload, rndrsp, cleantext} = require('./shared.js');
const rules = require('./rules.js');

module.exports = function(message) {
  if (message.author.bot) return; //Ignore bot messages

  const bot = this;
  const content = message.content;
  const channelID = message.channel.id;
  const channel = bot.channels.get(channelID);
  const mentions = Array.from(message.mentions.users.keys());

  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with `!`
  if (content.substring(0, 1) == '!') {
    let args = content.substring(1).split(' ');
    let cmd = args[0].toLowerCase();
    args = args.splice(1);

    switch(cmd) {
      case 'ping':
        message.reply('Pong!');
        break;
      case 'pong':
        channel.send('That\'s my role!');
        break;
      case 'commands':
        channel.send(help());
        break;
      case 'ban':
        if (mentions.length > 0) {
          if (mentions.indexOf('279331985955094529') !== -1) 
            channel.send("You try to ban me? I'll ban you!")
          else
            channel.send("I'm not in charge of banning players");
          break;
        }
      case 'whyban':
        if (mentions.length > 0)
          channel.send("Player's aren't cards, silly");
        else
          channel.send(whyban(args));
        break;
      case 'banlist':
        if (channel.id != 387805334657433600)
          channel.send("I'm excited you want to follow the ban list, but to keep the channel from clogging up, can you ask me in <#387805334657433600>?");
        else
          channel.send(banlist());
        break;
      case 'rule':
      case 'rules':
      case 'ruling':
        channel.send(rules(args));
        break;
      case 'errata':
        channel.send(errata(args));
        break;
      case 'compliment':
      case 'flirt':
        channel.send(compliment());
        break;
      case 'burn':
      case 'insult':
        channel.send(insult());
        break;
      case 'card':
        const genCounter = bot.emojis.find("name", "GenCounter").toString();
        channel.send(card(args, genCounter));
        break;
    }
    return;
  }

  var rsp = checkSass(content);
  if (rsp) channel.send(rsp);

  checkMentions.call(bot, mentions, channelID);
}

// Responses
function help() {
  const help = reload('../config/help.json');
  let message = "";
  for (var key in help) {
    message += "\n" + help[key];
  }
  return message;
}

function compliment() {
  const command = reload('../config/commands.json');
  return rndrsp(command['compliment']);
}

function insult() {
  const command = reload('../config/commands.json');
  return rndrsp(command['insult']);
}

function card(card, genCounter) {
  var cards = reload('../config/cards.json');
  card = cleantext(card.join(" ")); // re-merge string

  if (!card) return rndrsp(["Specify a card..."]);

  for (var key in cards) {
    if (cleantext(key).indexOf(card) === 0) {  
      return `${cards[key].replace(/:GenCounter:/gi, genCounter)}`;
    }
  }

  return ("That's not a valid card name");
}

function banlist() {
  const {bans, watchlist} = reload('../config/bans.json');
  let message = "**Player-made Ban List:**\n=====";
  for (var key in bans) {
    message += "\n" + key;
  }
  message += "\n=====\n**Watchlist:**\n(not banned)"
  for (var key in watchlist) {
    message += "\n" + key;
  }
  message += "\n=====\nYou can ask me why a card was banned with \"!whyban *card name*\"";
  return message;
}

function whyban(card, mentions) {
  card = cleantext(card.join(" ")); // remerge string

  if (!card) return banlist();

  const {bans, watchlist} = reload('../config/bans.json');

  let merge = Object.assign({}, bans, watchlist);
  for (var key in merge) {
    if (cleantext(key).indexOf(card) === 0)
      return `*${key}*:\n${rndrsp(merge[key])}`;
  }

  return rndrsp(["That card isn't banned. :D", `Oh lucky you, ${card} isn't banned`]);
}

function errata(args) {
  return "You can check errata's here:\nhttps://drive.google.com/file/d/1eVyw_KtKGlpUzHCxVeitomr6JbcsTl55/view";
}

function checkSass(content) {
  var sass = reload('../config/sass.json');

  for (var key in sass) {
    if (content.match(new RegExp(key, "i")))
      return rndrsp(sass[key]);
  }
}

function checkMentions(mentions, channelID) {
  if (mentions.length <= 0) return;
  var bot = this;
  var commands = reload('../config/commands.json');

  // if (mentions.indexOf('140143063711481856') !== -1)
  if (mentions.indexOf('279331985955094529') !== -1)
    bot.channels.get(channelID).send(rndrsp(commands["hello"]));

  if (mentions.indexOf('279788856285331457') !== -1)
    bot.channels.get(channelID).send('Don\'t @ the Oracle. He sees everything anyway');
}
