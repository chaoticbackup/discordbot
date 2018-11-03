const {reload, rndrsp, cleantext} = require('./shared.js');
const rules = require('./rules.js');
const fs = require('fs-extra');
const path = require('path');
const API = require('./database.js').default;
const cardsdb = new API();
import {banlist, whyban, limited, goodstuff, badultras} from './bans.js';

module.exports = function(message) {
  if (process.env.NODE_ENV == "development" && message.guild.id != "504052742201933824") return; // Dev Server
  if (message.author.bot) return; //Ignore bot messages

  const bot = this;
  const content = message.content;
  const channel = bot.channels.get(message.channel.id);
  const mentions = Array.from(message.mentions.users.keys());

  // Prevents sending an empty message
  const send = (message) => {
    if (message) channel.send(message).catch(console.error);
  }

try {
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
        if (message.guild.id == 135657678633566208 && (channel.id != 387805334657433600 && channel.id != 418856983018471435))
          channel.send("To be curtious to other conversations, ask me in <#387805334657433600> :)");
        else
          send(help());
        break;
      /* Cards */
      case 'c':
      case 'card':
        send(cardsdb.card(args, bot));
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
          send(whyban(args));
          break;
        }
      case 'banlist':
        if (message.guild.id == 135657678633566208 && (channel.id != 387805334657433600 && channel.id != 418856983018471435 && channel.id !=473975360342458368))
          channel.send("I'm excited you want to follow the ban list, but to keep the channel from clogging up, can you ask me in <#387805334657433600>?");
        else
          send(banlist());
        break;
      /* Rule */
      case 'rule':
      case 'rules':
      case 'ruling':
        send(rules(args));
        break;
      /* Compliments */
      case 'compliment':
      case 'flirt':
        send(compliment(args));
        break;
      /* Insults */
      case 'burn':
      case 'roast':
      case 'insult':
        if (mentions.indexOf('279331985955094529') !== -1) channel.send("<:Bodal:401553896108982282> just... <:Bodal:401553896108982282>");
        else send(insult(args));
        break;
      /* Documents */
      case 'rulebook':
        channel.send("https://drive.google.com/file/d/1kzkAUXj-xsr19XkVp-cYr5V7QXGgdGMT/view");
        break;
      case 'cr':
        channel.send("<https://drive.google.com/file/d/1BFJ2lt5P9l4IzAWF_iLhhRRuZyNIeCr-/view>");
        break;
      case 'errata':
        channel.send("<https://drive.google.com/file/d/1eVyw_KtKGlpUzHCxVeitomr6JbcsTl55/view>");
        break;
      case 'guide':
        channel.send("<https://docs.google.com/document/d/1WJZIiINLk_sXczYziYsizZSNCT3UUZ19ypN2gMaSifg/view>");
        break;
      case 'starters':
        send(starters());
        break;
      /* Misc */
      case 'sandwich':
        channel.send(":bread: :cheese: :bacon: :tomato: :meat_on_bone: :bread: -> :hamburger:");
        break;
      case 'pizza':
        channel.send(":bread: :tomato: :cheese: :meat_on_bone: -> :pizza:");
        break;
      case 'sandwitch':
        send(cardsdb.card(["Arkanin"], bot));
        break;
      case 'joke':
        send(joke());
        break;
      case 'never':
      case 'nowornever':
        send(nowornever(args));
        break;
      case 'strong':
      case 'good':
      case 'best':
        send(goodstuff(args));
        break;
      case 'goodstuff':
        if (message.guild.id == 135657678633566208 && (channel.id != 387805334657433600)) {
          channel.send("This list is long, you can ask for a specific type or ask in <#387805334657433600>")
        }
        send(goodstuff());
        break;
      case 'limited':
        send(limited());
        break;
      case 'bad':
      case 'badstuff':
      case 'badultras':
        send(badultras());
        break;
      case 'rm':
      case 'delete':
        let lstmsg = bot.user.lastMessage;
        if (lstmsg && lstmsg.deletable) lstmsg.delete(); // lstmsg.deletable
        if (message.deletable) message.delete(); // delete user msg
        break;
      /* Moderator Only */
      case 'haxxor':
        if (message.guild.id == '135657678633566208' &&
          (message.member.roles.find(role => role.name==="Administrator") || message.member.roles.find(role => role.name==="Moderator"))
        ) {
          channel.send('Resetting...')
          .then(msg => {
            fs.remove(path.join(__dirname, '../db'), (err) => {
              new API();
              bot.destroy();
            });
          });
        }
        break;
    }
    return;
  }

  // If no commands check message content for quips
  send(checkSass(content));

  send(checkMentions(mentions));
  // checkMentions.call(bot, mentions, channel.id);
}
catch (err) {
  console.error(err);
  bot.destroy();
}
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

function starters() {
  const commands = reload('../config/commands.json');
  return commands["starter"][0];
}

function nowornever(card) {
  const cards = require('../config/nowornever.json');
  card = cleantext(card.join(" ")); // re-merge string

  if (!card) {
    // Return random card
    var keys = Object.keys(cards);
    return `${cards[keys[keys.length * Math.random() << 0]]}`;
  }

  for (var key in cards) {
    if (cleantext(key).indexOf(card) === 0) {
      return `${cards[key]}`;
    }
  }
}

function checkSass(content) {
  const sass = reload('../config/sass.json');

  for (var key in sass) {
    if (content.match(new RegExp(key, "i")))
      return rndrsp(sass[key]);
  }
}

function checkMentions(mentions) {
  if (mentions.length <= 0) return;
  const commands = reload('../config/commands.json');
  let message = "";

  // if (mentions.indexOf('140143063711481856') !== -1) //kingmaxor4

  if (mentions.indexOf('279788856285331457') !== -1) // Afjak
    message = ('Don\'t @ the Oracle. He sees everything anyway');

  if (mentions.indexOf('279331985955094529') !== -1) // ChaoticBacktalk
    message = (rndrsp(commands["hello"]));

  return message;
}
