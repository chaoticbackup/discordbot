const {reload, rndrsp, cleantext} = require('./shared.js');
const rules = require('./rules.js');
const API = require('./database.js').default;
const cardsdb = new API();

module.exports = function(message) {
  if (message.author.bot) return; //Ignore bot messages

  const bot = this;
  const content = message.content;
  const channel = bot.channels.get(message.channel.id);
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
      /* Commands */
      case 'commands':
        if (message.guild.id == 135657678633566208 && channel.id != 387805334657433600)
          channel.send("To be curtious to other conversations, ask me in <#387805334657433600> :)");
        else
          channel.send(help());
        break;
      /* Cards */
      case 'card':
        channel.send(cardsdb.card(args, bot));
        break;
      /* Banlist and Bans */
      case 'ban':
        if (mentions.length > 0) {
          if (mentions.indexOf('279331985955094529') !== -1) 
            channel.send("You try to ban me? I'll ban you!")
          else
            channel.send("I'm not in charge of banning players");
          break;
        }
      case 'whyban':
        if (mentions.length > 0) {
          channel.send("Player's aren't cards, silly");
          break;
        }
        else if (args.length > 0) {
          channel.send(whyban(args));
          break;
        }
      case 'banlist':
        if (message.guild.id == 135657678633566208 && channel.id != 387805334657433600)
          channel.send("I'm excited you want to follow the ban list, but to keep the channel from clogging up, can you ask me in <#387805334657433600>?");
        else
          channel.send(banlist());
        break;
      /* Rule */
      case 'rule':
      case 'rules':
      case 'ruling':
        channel.send(rules(args));
        break;
      /* Compliments */
      case 'compliment':
      case 'flirt':
        channel.send(compliment(args));
        break;
      /* Insults */
      case 'burn':
      case 'roast':
      case 'insult':
        if (mentions.indexOf('279331985955094529') !== -1) channel.send("<:Bodal:401553896108982282> just... <:Bodal:401553896108982282>");
        else channel.send(insult(args));
        break;
      /* Documents */
      case 'rulebook':
        channel.send("https://drive.google.com/file/d/1kzkAUXj-xsr19XkVp-cYr5V7QXGgdGMT/view");
        break;
      case 'cr':
        channel.send("https://drive.google.com/file/d/1BFJ2lt5P9l4IzAWF_iLhhRRuZyNIeCr-/view");
        break;
      case 'errata':
        channel.send("https://drive.google.com/file/d/1eVyw_KtKGlpUzHCxVeitomr6JbcsTl55/view");
        break;
      case 'guide':
        channel.send("https://docs.google.com/document/d/1WJZIiINLk_sXczYziYsizZSNCT3UUZ19ypN2gMaSifg/view");
        break;
      case 'starters':
        channel.send(starter());
        break;
      /* Misc */
      case 'sandwich':
        channel.send(":bread: :cheese: :bacon: :tomato: :meat_on_bone: :bread: -> :hamburger:");
        break;
      case 'joke':
        channel.send(joke());
        break;
      /* Moderator Only */
      case 'haxxor':
        if (message.guild.id == 135657678633566208 &&
          (message.member.roles.find("name", "Ultra Rare") || message.member.roles.find("name", "Super Rare"))
        ) {
          channel.send('Resetting...')
            .then(msg => bot.destroy())
        }
        break;
    }
    return;
  }

  var rsp = checkSass(content);
  if (rsp) channel.send(rsp);

  checkMentions.call(bot, mentions, channel.id);
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

function insertname(resp, name) {
  if (name)
    resp = resp.replace(/\{\{.+?\|(x*(.*?)|(.*?)x*)\}\}/ig, (match, p1, p2) => {return p1.replace(/x/i, name)});
  else
    resp = resp.replace(/\{\{(.*?)\|.*?\}\}/ig, (match, p1) => {return p1});
  return resp;
}

function compliment(args) {
  const command = reload('../config/commands.json');
  return insertname(rndrsp(command['compliment']), args.join(" "));
}

function insult(args) {
  const command = reload('../config/commands.json');
  return insertname(rndrsp(command['insult']), args.join(" "));
}

function joke() {
  const command = reload('../config/commands.json');
  return rndrsp(command["joke"]);
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

function whyban(card) {
  card = cleantext(card.join(" ")); // remerge string

  const {bans, watchlist, joke} = reload('../config/bans.json');

  let merge = Object.assign({}, bans, watchlist, joke);
  for (var key in merge) {
    if (cleantext(key).indexOf(card) === 0)
      return `*${key}*:\n${rndrsp(merge[key])}`;
  }

  return rndrsp(["That card isn't banned. :D", `Oh lucky you, ${card} isn't banned`]);
}

function starter() {
  const commands = reload('../config/commands.json');
  return commands["starter"][0];
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

  // if (mentions.indexOf('140143063711481856') !== -1) //kingmaxor4

  if (mentions.indexOf('279331985955094529') !== -1)
    bot.channels.get(channelID).send(rndrsp(commands["hello"]));

  if (mentions.indexOf('279788856285331457') !== -1)
    bot.channels.get(channelID).send('Don\'t @ the Oracle. He sees everything anyway');
}
