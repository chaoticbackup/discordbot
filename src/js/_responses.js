const {reload, rndrsp, cleantext} = require('./shared.js');
const rules = require('./rules.js');
const fs = require('fs-extra');
const path = require('path');
const API = require('./database/database.js').default;
import {rate_card} from './database/rate.js';
import {full_art, find_card, display_card, read_card} from './database/card.js';
import {goodstuff, badultras, funstuff} from './goodstuff.js';
import {banlist, whyban, limited, shakeup} from './bans.js';

function mainserver(message) {
  return message.guild.id == "135657678633566208";
}

function moderator(message) {
  return (
    message.member.roles.find(role => role.name==="Administrator") ||
    message.member.roles.find(role => role.name==="Moderator")
  );
}

module.exports = function(message) {
  // Dev Server Only
  if (process.env.NODE_ENV == "development" && message.guild.id != "504052742201933824") return;
  // if (process.env.NODE_ENV != "development" && message.guild.id == "504052742201933824") return;
  if (message.author.bot) return; //Ignore bot messages

  const bot = this;
  const content = message.content;
  const channel = bot.channels.get(message.channel.id);
  const mentions = Array.from(message.mentions.users.keys());

  // Prevents sending an empty message
  const send = (message, options) => {
    if (message) channel.send(message, options).catch(console.error);
  }

  const insertname = (resp, name) => {
    // Replace the mention with the display name
    if (mentions.length > 0) {
      name = this.guilds.get(message.guild.id).members.get(mentions[0]).displayName;
    }
    if (name)
      resp = resp.replace(/\{\{.+?\|(x*(.*?)|(.*?)x*)\}\}/ig, (match, p1, p2) => {return p1.replace(/x/i, name)});
    else
      resp = resp.replace(/\{\{(.*?)\|.*?\}\}/ig, (match, p1) => {return p1});
    return resp;
  }

  if (content.substring(0, 4).toLowerCase() == "#ban") {
    let name = (content.charAt(5) == " ") ? content.substring(6) : content.substring(5);
    send(whyban(name));
  }

try {
  // It will listen for messages that will start with `!` or `c!`
  if (content.charAt(0) == '!' || content.substring(0, 2).toLowerCase() == "c!") {
    const commands = reload('../config/commands.json');

    let args = (() => {
      if (content.charAt(1) == "!") return content.substring(2);
      else return content.substring(1);
    })().split(' ');

    let cmd = args[0].toLowerCase().trim();

    let options = [];
    args = args.splice(1).join(" ").replace(/(?:--|—)([^\s]+)/g, (match, p1) => {
      options.push(p1);
      return "";
    }).trim();

    if (options.includes("help")) {
      return send(help(cmd));
    }

    /* Commands */
    switch(cmd) {
      case 'help':
        if (content.charAt(0) == "!") break;
      case 'commands':
        if (!args && (mainserver(message) && channel.id != 387805334657433600))
          channel.send("To be curtious to other conversations, ask me in <#387805334657433600> :)");
        else
          send(help(args));
        break;
      /* Cards */
      case 'c':
      case 'card':
        if (mainserver(message) &&
          (channel.id == "135657678633566208" && message.member.roles.size === 1)
        ) {
          send("Please ask me in <#387805334657433600>");
          break;
        }
        send(display_card(args, options, bot));
        break;
      case 'full':
      case 'fullart':
        send(full_art(args));
        break;
      case 'find':
        send(find_card(args));
        break;
      case 'rate':
        send(rate_card(args, options, bot));
        break;
      /* Rule */
      case 'rules':
        if (args.length < 1) {
          send(rules("all"));
          break;
        }
      case 'rule':
      case 'ruling':
        if (args.length < 1)
          channel.send(`"Please provide a rule, or use **!rulebook** for the Rules"`);
        else
        send(rules(args));
        break;
      /* Compliments */
      case 'flirt':
      case 'compliment':
        send(insertname(rndrsp(commands['compliment'], 'compliment'), args));
        break;
      /* Insults */
      case 'burn':
      case 'roast':
      case 'insult':
        if (mentions.indexOf('279331985955094529') !== -1)
          channel.send("<:Bodal:401553896108982282> just... <:Bodal:401553896108982282>");
        else
          send(insertname(rndrsp(commands['insult'], 'insult'), args));
        break;
      /* Jokes */
      case 'joke':
        send(rndrsp(commands["joke"], 'joke'));
        break;
      /* Documents */
      case 'rulebook':
        send(rulebook(args, options));
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
      /* Starters */
      case 'starter':
      case 'starters':
        if (options.includes("metal")) send(commands["starter"][1]);
        else if (options.includes("king")) send(commands["starter"][2]);
        else send(commands["starter"][0]);
        break;
      /* Banlist and Alternative Formats */
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
          send(whyban(args, options));
          break;
        }
      case 'banlist':
        if (mainserver(message) && (channel.id != 387805334657433600 && channel.id != 418856983018471435 && channel.id !=473975360342458368))
          channel.send("I'm excited you want to follow the ban list, but to keep the channel from clogging up, can you ask me in <#387805334657433600>?");
        else
          send(banlist(options));
        break;
      case 'limited':
        send(limited());
        break;
      case 'shakeup':
        send(shakeup());
        break;
      case 'strong':
      case 'good':
      case 'best':
      case 'goodstuff':
        send(goodstuff(args, options));
        break;
      case 'fun':
      case 'funstuff':
        send(funstuff());
        break;
      case 'bad':
      case 'badstuff':
      case 'badultras':
      case 'wasted':
        send(badultras());
        break;
      case 'rm':
      case 'delete':
        let lstmsg = bot.user.lastMessage;
        if (lstmsg && lstmsg.deletable) lstmsg.delete(); // lstmsg.deletable
        if (message.deletable) message.delete(); // delete user msg
        break;
      /* Misc */
      case 'readthecard':
        if (bot.guilds.get(message.guild.id).me.hasPermission("SEND_TTS_MESSAGES")) {
          if (mainserver(message)
            && (message.member.roles.find(role => role.name==="Administrator") || message.member.roles.find(role => role.name==="Moderator"))
            && (channel.id == "387805334657433600" || channel.id == "293610368947716096")) {
            send(read_card(args, options), {tts: true});
          }
          else {
            send(read_card(args, options), {tts: true});
          }
        }
        break;
      case 'sandwich':
        channel.send(":bread: :cheese: :bacon: :tomato: :meat_on_bone: :bread: -> :hamburger:");
        break;
      case 'pizza':
        channel.send(":bread: :tomato: :cheese: :meat_on_bone: -> :pizza:");
        break;
      case 'sandwitch':
        send(display_card("Arkanin", options, bot));
        break;
      case 'never':
      case 'nowornever':
        send(nowornever(args));
        break;
      /* Moderator Only */
      case 'haxxor':
        reset(message, channel);
        break;
      case 'clean':
        clean(message, channel);
        break;
    }
    return;
  }

  // If no commands check message content for quips
  send(checkSass.call(bot, mentions, message));
}
catch (error) {
  // Log/Print error
  console.error(error);

  // Ignore problems while in development
  if (process.env.NODE_ENV == "development") {
    return;
  }

  // Send Error to Bot Testing Server
  bot.channels.get("558184649466314752").send(error.stack);

  // Ignore programmer errors (keep running)
  if (
    error.name === "ReferenceError" ||
    error.name === "SyntaxError"
  ) {
    return;
  }

  // restart bot if unknown error
  bot.destroy();
}
}

function clean(message, channel) {
  if (message.member.roles.find(role => role.name==="Administrator") || message.member.roles.find(role => ))
}

function reset(message, channel) {
  if (mainserver(message) &&
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
}

/*
* Responses
*/
function help(args) {
  const {help} = reload('../config/commands.json');
  let message = "";

  if (args) {
    // detailed help
    if (help.hasOwnProperty(args) && help[args].long) {
      message = "```md\n"
        + help[args].cmd + "```"
        + help[args].long;
    }
    else {
      message = "Sorry, I don't have additional information about that command";
    }
  }
  else {
    // help list
    for (var key in help) {
      if (help[key].hasOwnProperty("short")) {
        message += "\n" + help[key].cmd + "\n";
        if (help[key].short !== "")
          message += "> (" + help[key].short + ")\n";
      }
    }
  }
  return message;
}

function rulebook(args, options) {
  const {languages, rulebook} = reload('../config/commands.json');

  let message = "";
  if (options.includes("list")) {
    for (let lan in languages) {
      message += `**${languages[lan]}**\n    ${lan} [`;

      for (let set in rulebook[lan]) {
        message += `${set}, `;
      }
      message = message.slice(0, -2);
      message += ']\n';
    };
    return message;
  }

  function rule_url(url) {
    return ("https://drive.google.com/file/d/" + url + "/view");
  }

  // Default is English AU
  if (!args) {
    return rule_url(rulebook["EN"]["AU"]);
  }

  args = args.split(' ');

  let lang = args[0].toUpperCase();
  if (rulebook.hasOwnProperty(lang)) {
    if (args.length === 1) {
      if (rulebook[lang].hasOwnProperty("AU")) {
        return rule_url(rulebook[lang]["AU"]);
      }
      else {
        return rule_url(rulebook[lang]["DOP"]);
      }
    }
    else {
      let set = args[1].toUpperCase();
      if (rulebook[lang].hasOwnProperty(set)) {
        return rule_url(rulebook[lang][set]);
      }
      else {
        return "I don't have that set in " + languages[lang];
      }
    }
  }
  else {
    return "I don't have a rulebook in that language";
  }

}

function nowornever(card) {
  const cards = require('../config/nowornever.json');
  card = cleantext(card); // re-merge string

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

function checkSass(mentions, message) {
  const {sass, tags} = reload('../config/sass.json');
  let content = message.content;

  for (var key in sass) {
    if (content.match(new RegExp(key, "i")))
      return rndrsp(sass[key]);
  }

  if (mentions.length <= 0) return;
  let response = "";

  // if (mentions.indexOf('140143063711481856') !== -1) //kingmaxor4

  if (mentions.indexOf('279788856285331457') !== -1) // Afjak
    return ('Don\'t @ the Oracle. He sees everything anyway');

  if (mentions.indexOf('279331985955094529') !== -1) {// ChaoticBacktalk
    if (content.match(new RegExp(/did.+(king).+(make|create)/, "i"))) {
      response = (rndrsp(tags["daddy"]));
    }
    else if (content.match(new RegExp(/who.+(made|created)/, "i"))) {
      try {
        let displayname = this.guilds.get(message.guild.id).members.get("140143063711481856").displayName;
        response = `${displayname} taught me Chaotic`;
      }
      catch(err) {}
    }
    else {
      response = (rndrsp(tags["hello"], 'hello'));
    }
  }

  return response;
}
