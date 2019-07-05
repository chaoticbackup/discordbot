const {cleantext, rndrsp, moderator} = require('./shared.js');
const rules = require('./rules.js');
const fs = require('fs-extra');
const path = require('path');
const API = require('./database/database.js').default;
const {RichEmbed} = require('discord.js');
import {rate_card} from './database/rate';
import {full_art, find_card, display_card, read_card} from './database/card';
import {goodstuff, badultras, funstuff} from './goodstuff';
import {banlist, whyban} from './bans';
import {checkSass} from './sass';
import {rulebook} from './rulebook';
import {tierlist} from './meta';
import {servers, channels, users} from '../config/server_ids.json';
import {menu, make, order} from './menu';
import {joinTribe, leaveTribe, showTribe, brainwash} from './tribe';
import {lookingForMatch, cancelMatch} from './match_making';

function mainserver(message) {
  if (!message.guild) return false;
  return message.guild.id == servers.main;
}

module.exports = async function(message, logger) {
  //Ignore bot messages
  if (message.author.bot) return;
  // Dev Server Only
  if (process.env.NODE_ENV == "development" && !(message.guild && message.guild.id == servers.develop)) return;

  const bot = this;
  const content = message.content;
  const channel = bot.channels.get(message.channel.id);
  const mentions = Array.from(message.mentions.users.keys());
  const {guild, guildMember} = await async function() {
    if (!message.guild) return {guild: null, guildMember: null};
    let guild = bot.guilds.get(message.guild.id);
    let guildMember;
    if (message.member) guildMember = message.member;
    else {
      await guild.fetchMember(message.author).then((member) => guildMember = member);
    }
    return {guild: guild, guildMember: guildMember}
  }();

  // Prevents sending an empty message
  const send = (msg, options) => {
    if (msg) channel.send(msg, options).catch(error => logger.error(error.stack));
  }

  const hasPermission = (permission) => {
    if (!message.guild) return false;
    return guild.me.hasPermission(permission);
  }

  const insertname = (resp, name) => {
    // Replace the mention with the display name
    if (guild && mentions.length > 0) {
      let member = guild.members.get(mentions[0]);
      if (member) {
        name = member.displayName;
      }
    }
    if (name)
      resp = resp.replace(/\{\{.+?\|(x*(.*?)|(.*?)x*)\}\}/ig, (match, p1, p2) => {return p1.replace(/x/i, name)});
    else
      resp = resp.replace(/\{\{(.*?)\|.*?\}\}/ig, (match, p1) => {return p1});
    return resp;
  }

try {

  // It will listen for messages that will start with `!` or `c!`
  if (content.charAt(0) == '!' || content.substring(0, 2).toLowerCase() == "c!") {
    const commands = require('../config/commands.json');

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
        if (content.charAt(0) == "!") {
          let rtn_str = "Use **!commands** or **c!help**";
          if (mainserver(message) && channel.id != channels.bot_commands) {
            rtn_str += " in <#387805334657433600>";
          }
          if (bot.users.get('159985870458322944')) //meebot
            setTimeout(() => channel.send(rtn_str), 500);
          else
            channel.send(rtn_str);
          break;
        }
        /* falls through */
      case 'commands':
        if (!args && (mainserver(message) && channel.id != channels.bot_commands))
          channel.send("To be curtious to other conversations, ask me in <#387805334657433600> :)");
        else
          if (args) {
            send(help(args));
          }
          else {
            channel.send(help())
            .then(() => {
              donate(channel);
            });
          }
        break;
      /* Cards */
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
      case 'ruling':
        if (args.length < 1) {
          send(rules("all"));
          break;
        }
        /* falls through */
      case 'keyword':
      case 'rule':
      case 'rules':
        if (args.length < 1)
          channel.send(`Please provide a rule, or use **!rulebook** or **!guide**`);
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
        else send(commands["starter"][1]);
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
        /* falls through */
      case 'whyban':
        if (mentions.length > 0) {
          channel.send("Player's aren't cards, silly");
        }
        else if (args.length > 0) {
          send(whyban(args, options));
        }
        break;
      case 'banlist':
        if (mainserver(message) && (channel.id != channels.bot_commands && channel.id != 418856983018471435 && channel.id !=473975360342458368))
          channel.send("I'm excited you want to follow the ban list, but to keep the channel from clogging up, can you ask me in <#387805334657433600>?");
        else {
          channel.send(banlist(options))
          .then(() => {
            if (options.length == 0)
              donate(channel);
          });
        }
        break;
      case 'limited':
        if (mainserver(message) && (channel.id != channels.bot_commands && channel.id != 418856983018471435 && channel.id !=473975360342458368))
          channel.send("To keep the channel from clogging up, can you ask me in <#387805334657433600>?");
        else {
          options.push("limited");
          send(banlist(options));
        }
        break;
      case 'pauper':
        options.push("pauper");
        send(banlist(options));
        break;
      case 'noble':
        options.push('noble');
        send(banlist(options));
        break;
      case 'shakeup':
        if (mainserver(message) && (channel.id != channels.bot_commands && channel.id != 418856983018471435 && channel.id !=473975360342458368))
          channel.send("To keep the channel from clogging up, can you ask me in <#387805334657433600>?");
        else {
          options.push("shakeup");
          send(banlist(options));
        }
        break;
      case 'tierlist':
        if (!args) {
          if ((mainserver(message) && channel.id != channels.bot_commands))
            channel.send("To be curtious to other conversations, ask me in <#387805334657433600> :)");
          else {
            channel.send(new RichEmbed().setImage('https://drive.google.com/uc?id=1h9QOd2sk1KD4WK91FLy5CQPcar4twGlA'))
            .then(() => {
              send(tierlist());
            });
          }
        }
        else {
          send(tierlist(cleantext(args)));
        }
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
      case 'badultras':
      case 'wasted':
      case 'wastedultras':
        send(badultras());
        break;
      case "lf":
      case "match":
        if (guild && hasPermission("MANAGE_ROLES")) {
          if (mainserver(message) && channel.id != channels.match_making) return;
          send(lookingForMatch(cleantext(args), guild, guildMember));
        }
        break;
      case "cancel":
        if (guild && hasPermission("MANAGE_ROLES")) {
          if (mainserver(message) && channel.id != channels.match_making) return;
          send(cancelMatch(guild, guildMember));
        }
        break;
      /* Misc */
      case 'watch':
        send("Season 1: https://www.youtube.com/playlist?list=PL0qyeKPgEbR7bSU1LkQZDw3CjkSzChI-s\n"
          + "Season 2: https://www.youtube.com/playlist?list=PL0qyeKPgEbR7Fs9lSsfTEjODyoXWdXP6i\n"
          + "Season 3: https://www.youtube.com/playlist?list=PL0qyeKPgEbR5qdu0i9cyxl8ivUdxihAc4"
        );
        break;
      case 'donate':
        donate(channel);
        break;
      case 'collection':
        send("https://chaoticbackup.github.io/collection/");
        break;
      case 'rm':
        let lstmsg = bot.user.lastMessage;
        if (lstmsg && lstmsg.deletable) lstmsg.delete(); // lstmsg.deletable
        if (message.deletable) message.delete(); // delete user msg
        break;
      case 'menu':
        send(menu());
        break;
      case 'order':
        send(order(cleantext(args, options, bot)));
        break;
      case 'make':
      case 'cook':
        if (cleantext(args) == 'sandwitch')
          send(display_card("Arkanin", options, bot));
        else
          send(make(cleantext(args, options, bot)));
        break;
      case 'never':
      case 'nowornever':
        send(nowornever(cleantext(args)));
        break;
      case 'unset':
      case 'gone':
        send(gone(cleantext(args), bot));
        break;
      case 'tribe':
        if (!args) {
          send(showTribe(guild, guildMember));
          break;
        }
      case 'join':
        if (guild && hasPermission("MANAGE_ROLES")) {
          send(await joinTribe(args, guild, guildMember));
        }
        break;
      case 'leave':
        if (guild && hasPermission("MANAGE_ROLES")) {
          let leaving_tribe = await leaveTribe(guild, guildMember);
          if (leaving_tribe) send(`You have left the ` + leaving_tribe);
        }
        break;
      case 'bw':
      case 'brainwash':
        if (guild && hasPermission("MANAGE_ROLES")) {
          if (mentions.length > 0) {
            if (moderator(message)) {
              send(brainwash(guild, guild.members.get(mentions[0]), mentions));
            }
            else break;
          }
          else {
            send(brainwash(guild, guildMember, mentions));
          }
        }
        break;
      /* Joke Cards */
      case 'gone':
      case 'fan':
        send(gone(cleantext(args)));
        break;
      /* Moderator Only */
      case 'readthecard':
        if (hasPermission("SEND_TTS_MESSAGES")) {
          if (mainserver(message)) {
            if (channel.id == channels.bot_commands || channel.id == "293610368947716096") {
              if (!moderator(message)) {
                send(read_card(args, options, bot));
                return;
              }
            }
            else return;
          }
          send(read_card(args, options, bot), {tts: true});
        }
        break;
      case 'haxxor':
        if (mainserver(message) && moderator(message)) {
          channel.send('Resetting...')
          .then(msg => {
            fs.remove(path.join(__dirname, '../db'), (err) => {
              new API();
              bot.destroy();
            });
          });
        }
        break;
      case 'clear':
      case 'clean':
      case 'delete':
        if (moderator(message)) {
          args = parseInt(args);
          if (typeof args !== "number") break;
          if (args <= 25) {
            if (mentions.length > 0) {
              channel.fetchMessages()
              .then(messages => {
                let b_messages = messages.filter(m =>
                  mentions.includes(m.author.id)
                );
                if (b_messages.size > 0)
                  channel.bulkDelete(b_messages);
              });
            }
            else {
              channel.bulkDelete(args + 1);
            }
          }
          else {
            // only delete the clear command
            message.delete();
            channel.send("Enter a number less than 20");
          }
        }
        break;
    }
    return;
  }

  if (content.substring(0, 4).toLowerCase() == "#ban") {
    let name = (content.charAt(5) == " ") ? content.substring(6) : content.substring(5);
    return send(whyban(name));
  }

  // If no commands check message content for quips
  send(checkSass.call(bot, mentions, message));
}
catch (error) {
  // Log/Print error
  logger.error(error.stack);

  // Ignore problems while in development
  if (process.env.NODE_ENV == "development") {
    return;
  }

  // Send Error to Bot Testing Server
  bot.channels.get(channels.errors).send(error.stack).catch(logger.error);

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

/*
* Responses
*/
function donate(channel) {
  channel.send(
    new RichEmbed()
      .setDescription("[Support the development of Chaotic BackTalk](https://www.paypal.me/ChaoticBackup)")
      .setTitle("Donate")
  );
}

function help(args) {
  const help = require('../config/help.json');
  let message = "";

  if (args) {
    // detailed help
    if (help.hasOwnProperty(args) && help[args].long) {
      message = "```md\n"
        + help[args].cmd + "\n```"
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

function nowornever(card) {
  const cards = require('../config/nowornever.json');

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

function gone(card, bot) {
  const {GoneChaotic, Gone2Chaotic, GoneChaotic3} = require("../config/gonechaotic.json");

  let merge = Object.assign({}, GoneChaotic, Gone2Chaotic, GoneChaotic3);

  if (card.toLowerCase()==="nakan") {
    let line = ""
      + "88" + bot.emojis.find(emoji => emoji.name==="Courage").toString() + " "
      + "76" + bot.emojis.find(emoji => emoji.name==="Power").toString() + " "
      + "23" + bot.emojis.find(emoji => emoji.name==="Wisdom").toString() + " "
      + "41" + bot.emojis.find(emoji => emoji.name==="Speed").toString() + " "
      + "| " + "59" + " E";

    return new RichEmbed()
      .setTitle("Nakan")
      .setURL(merge["Nakan"])
      .setDescription(line)
      .setImage(merge["Nakan"]);
  }

  if (card) {
    for (var key in merge) {
      if (cleantext(key).indexOf(card) === 0) {
        return new RichEmbed()
          .setTitle(key)
          .setURL(merge[key])
          .setImage(merge[key]);
      }
    }
    return rndrsp(["Yokkis can't find your card", "I guess that card isn't *gone*"]);
  }

  card = rndrsp(Object.keys(merge));
  return new RichEmbed()
    .setTitle(card)
    .setURL(merge[card])
    .setImage(merge[card]);
}
