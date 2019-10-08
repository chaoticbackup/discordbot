const API = require('./js/database/database.js').default;
const {RichEmbed} = require('discord.js');
const commands = require('./config/commands.json');
const {servers} = require('./config/server_ids.json');

import {
  cleantext, rndrsp, isModerator, uppercase, hasPermission, is_channel,
  rate_card,
  full_art, find_card, display_card, read_card,
  goodstuff, funstuff,
  banlist, whyban,
  checkSass,
  rulebook,
  tier,
  menu, make, order,
  tribe, brainwash,
  lookingForMatch, cancelMatch,
  meetup,
  speakers
} from './js';

function mainserver(message) {
  if (!message.guild) return false;
  return message.guild.id == servers.main.id;
}

function bot_commands(channel) {
  return is_channel("main", channel, "bot_commands");
}

export default (async function(message, logger) {
  //Ignore bot messages
  if (message.author.bot) return;
  // Dev Server Only
  if (process.env.NODE_ENV == "development" && (!message.guild || (message.guild.id != servers.develop.id))) return;

  const bot = this;
  const content = message.content;
  const channel = bot.channels.get(message.channel.id);
  const mentions = Array.from(message.mentions.users.keys());

  // Prevents sending an empty message
  const send = (msg, options) => {
    if (msg) channel.send(msg, options).catch(error => logger.error(error.stack));
  }

try {
  // It will listen for messages that will start with `!` or `c!`
  if (content.charAt(0) == '!' || content.substring(0, 2).toLowerCase() == "c!") {

    /**
     * Turns the first 'word' after the command character into the `cmd`
     * Merges the remaining array of words into `args`
     */

    let args = (() => {
      if (content.charAt(1) == "!") return content.substring(2);
      else return content.substring(1);
    })().split(' ');

    const cmd = args[0].toLowerCase().trim();

    let options = [];
    args = args.splice(1).join(" ").replace(/(?:--|—)([^\s]+)/g, (match, p1) => {
      options.push(p1);
      return "";
    }).split("\n")[0].trim();

    /**
    *   Reduced command sets for other servers
    */

    if (message.guild && message.guild.id == servers.trading.id)
      return trading_server(cmd, args, options, bot, send);

    /**
    *  Helper functions
    */

    // If the message was sent in a guild, returns the `guild` and `guildMember`
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



    // Replace the mention with the display name
    const insertname = (resp, name) => {
      if (guild && mentions.length > 0) {
        let member = guild.members.get(mentions[0]);
        if (member) {
          name = member.displayName;
        }
      }
      if (name)
        resp = resp.replace(/\{\{.+?\|(x*(.*?)|(.*?)x*)\}\}/ig, (match, p1) => {return p1.replace(/x/i, name)});
      else
        resp = resp.replace(/\{\{(.*?)\|.*?\}\}/ig, (match, p1) => {return p1});
      return resp;
    }

    /**
     * International Server
     */
    if (guild && guild.id == servers.international.id) {
      switch(cmd) {
        case 'colour':
        case 'color': {
          args = args.split(" ");
          if (args.length < 2) break;
          switch(cleantext(args[0])) {
            case 'set': {
              const color = guild.roles.find(role => role.name == cleantext(args[1]));
              if (color) {
                guildMember.addRole(color);
                send(`Now your name is ${uppercase(args[1])}!`);
              }
              else send("Sorry I don't have that color role");
            }
            break;
            case 'remove': {
                const color = guild.roles.find(role => role.name == cleantext(args[1]));
                if (color) {
                  guildMember.removeRole(color);
                }
              }
            break;
          }
          return;
        }
        case 'region':
        case 'regions': {
          meetup(guildMember, guild, args.split(" "), mentions).then(send);
          break;
        }
        case 'watch':
          send("Season 1: https://www.youtube.com/playlist?list=PL0qyeKPgEbR7bSU1LkQZDw3CjkSzChI-s\n"
            + "Season 2: https://www.youtube.com/playlist?list=PL0qyeKPgEbR7Fs9lSsfTEjODyoXWdXP6i\n"
            + "Season 3: https://www.youtube.com/playlist?list=PL0qyeKPgEbR5qdu0i9cyxl8ivUdxihAc4"
          );
        break;
      }
    }

    /**
    *   Main bot code (full commands)
    */
    switch(cmd) {
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

      /* Banlist and Formats */
      case 'legacy':
      case 'standard':
      case 'banlist':
        if (mainserver(message) && (!bot_commands(channel) && channel.id != 418856983018471435 && channel.id !=473975360342458368))
          channel.send("I'm excited you want to follow the ban list, but to keep the channel from clogging up, can you ask me in <#387805334657433600>?");
        else {
          channel.send(banlist(options))
          .then(() => {
            if (options.length == 0)
              donate(channel);
          });
        }
        break;
      case 'rotation':
      case 'rotate':
      case 'modern':
        if (mainserver(message) && (!bot_commands(channel) && channel.id != 418856983018471435 && channel.id !=473975360342458368))
          channel.send("To keep the channel from clogging up, can you ask me in <#387805334657433600>?");
        else {
          options.push("rotation");
          send(banlist(options));
        }
        break;
      case 'pauper':
        options.push("pauper");
        send(banlist(options));
        break;
      case 'peasant':
      case 'noble':
        options.push('noble');
        send(banlist(options));
        break;
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
          if (options.includes("detailed")) {
            if (mainserver(message) && !bot_commands(channel)) {
              channel.send("To be curtious to other conversations, ask me in <#387805334657433600> :)");
            }
            else {
              send(whyban(args, options));
            }
          }
          else {
            send(whyban(args, options));
          }
        }
        else channel.send("Please provide a card or use !banlist");
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
      case 'wasted':
      case 'wastedultras':
      case 'badultras':
        channel.send("This command has been removed");
        break;
      case "lf":
      case "match":
        if (hasPermission(guild, "MANAGE_ROLES")) {
          if (mainserver(message) && !is_channel("main", channel, "match_making")) return;
          send(lookingForMatch(cleantext(args), guild, guildMember));
        }
        break;
      case "cancel":
        if (hasPermission(guild, "MANAGE_ROLES")) {
          if (mainserver(message) && !is_channel("main", channel, "match_making")) return;
          send(cancelMatch(guild, guildMember));
        }
        break;
      /* Misc */
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
      case 'join':
      case 'leave':
        channel.send("Use ``!tribe <join|leave>`` or ``!region <regionName> <join|leave>``")
        break;
      case 'tribe':
        tribe(guild, guildMember, args.split(" "))
        .then(send);
        break;
      case 'bw':
      case 'brainwash':
        brainwash(guild, guildMember, mentions)
        .then(send);
        break;
      case 'gone':
      case 'fan':
        send(gone(cleantext(args)));
        break;
      /* Languages */
      case 'speak':
      case 'speaker':
      case 'speakers':
      case 'language':
        speakers(guildMember, guild, args.split(" ")).then(send);
        break;
      /* Moderator Only */
      case 'readthecard':
        if (hasPermission(guild, "SEND_TTS_MESSAGES")) {
          if (mainserver(message)) {
            if (bot_commands(channel) || channel.id == "293610368947716096") {
              if (!isModerator(message.member)) {
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
        if (message.member.id === "140143063711481856") {
          channel.send('Resetting...')
          .then(() => {
            API.rebuild()
            .then(() => bot.destroy())
            .catch((err) => {
              send(err.message);
            });
          });
        }
        break;
      case 'clear':
      case 'clean':
      case 'delete':
        if (isModerator(message.member)) {
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
                  message.delete();
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

  // Reduced commands
  if (message.guild && message.guild.id == servers.trading.id) return;

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
  let server_source = message.guild ? message.guild.name : "DM";
  bot.channels.get(servers.develop.channels.errors)
    .send(server_source + ":\n"+ error.stack)
    .finally(logger.error);

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
})

function trading_server(cmd, args, options, bot, send) {
  switch(cmd) {
    case 'card':
    send(display_card(args, options, bot));
    break;
  case 'find':
    send(find_card(args));
    break;
  case 'rate':
    send(rate_card(args, options, bot));
    break;
  }
}
