import {RichEmbed, Message, Guild, Client, GuildMember} from 'discord.js';
import { Logger } from 'winston';

const API = require('./js/database/database.js').default;
const commands = require('./config/commands.json');
const {servers} = require('./config/server_ids.json');

import {Channel, SendFunction} from './js/definitions';

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
    speakers,
    color,
    faq,
    glossary
} from './js';

export default (async function(message: Message, logger: Logger) {
  //Ignore bot messages
  if (message.author.bot) return;
  // Dev Server Only
  if (process.env.NODE_ENV == "development" && (!message.guild || (message.guild.id != servers.develop.id))) return;

  //@ts-ignore
  const bot: Client = this; 
  const content: String = message.content;
  const mentions: string[] = Array.from(message.mentions.users.keys());
  
  // Prevents sending an empty message
  const send: SendFunction = (msg, options) => {
    if (msg) return message.channel.send(msg, options).catch(error => logger.error(error.stack))
    return Promise.resolve();
  }

  try {
    // If the message is a command
    if (content.charAt(0) == '!' || content.substring(0, 2).toLowerCase() == "c!") {
      return command_response(bot, mentions, message, send);
    }

    // #ban
    if (content.substring(0, 4).toLowerCase() == "#ban") {
      let name = (content.charAt(5) == " ") ? content.substring(6) : content.substring(5);
      return send(whyban(name));
    }
  
    // If no commands check message content for quips
    send(checkSass.call(bot, mentions, message));

  } catch (error) {
    // Log/Print error
    logger.error(error.stack);
  
    // Ignore problems while in development
    if (process.env.NODE_ENV == "development") return;
  
    // Send Error to Bot Testing Server
    let server_source = message.guild ? message.guild.name : "DM";

    (<Channel> bot.channels.get(servers.develop.channels.errors))
    .send(server_source + ":\n"+ error.stack);
  
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
});

const command_response = async (bot: Client, mentions: string[], message: Message, send: SendFunction) => {
  
  const {cmd, args, options} = parseCommand(message.content);

  if (options.includes("help")) {
    return send(help(cmd));
  }

  /**
    * Trading Server
    */
  if (message.guild && message.guild.id == servers.trading.id) {
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
    // Limited functions
    return;
  }

  const channel = message.channel;
  const {guild, guildMember} = <{guild: Guild, guildMember: GuildMember}> await messageGuild(message);

  // Function to replace the mention with the display name
  const insertname = (resp: string, name: string) => {
    if (guild && mentions.length > 0) {
      let member = guild.members.get(mentions[0]);
      if (member) {
        name = member.displayName;
      }
    }
    if (name)
      resp = resp.replace(/\{\{.+?\|(x*(.*?)|(.*?)x*)\}\}/ig, (match: any, p1: string) => {return p1.replace(/x/i, name)});
    else
      resp = resp.replace(/\{\{(.*?)\|.*?\}\}/ig, (match: any, p1: string) => {return p1});
    return resp;
  }

  /** 
    * International Server
    */
  if (guild && guild.id == servers.international.id) {
    switch(cmd) {
      case 'colour':
      case 'color':
        return color(args, guild, guildMember, send);
      case 'region':
      case 'regions':
        return meetup(guildMember, guild, args, mentions).then(send);
      case 'watch':
        return send("Season 1: https://www.youtube.com/playlist?list=PL0qyeKPgEbR7bSU1LkQZDw3CjkSzChI-s\n"
          + "Season 2: https://www.youtube.com/playlist?list=PL0qyeKPgEbR7Fs9lSsfTEjODyoXWdXP6i\n"
          + "Season 3: https://www.youtube.com/playlist?list=PL0qyeKPgEbR5qdu0i9cyxl8ivUdxihAc4"
        );
      default:
        // If no special commands, continue to full command set
        break;
    }
  }

  /**
    * Full command set
    */
  switch(cmd) {
    /* Help */
    case 'help':
      if (message.content.charAt(0) == "!") {
        let rtn_str = "Use **!commands** or **c!help**";
        if (!is_channel("main", channel, "bot_commands")) {
          rtn_str += " in <#387805334657433600>";
        }
        if (bot.users.get('159985870458322944')) //meebot
          setTimeout(() => send(rtn_str), 500);
        else
          send(rtn_str);
        break;
      }
      // falls through
    case 'commands':
      if (args) {
        send(help(flatten(args)));
      }
      else {
        if (!bot_commands(channel)) break;
        send(help())
        .then(() => {
          donate(channel);
        });
      }
      break;

  /*
   * Gameplay
   */

    /* Cards */
   case 'card':
      if (message.member.roles.size === 1 && !bot_commands(channel)) break;
      send(display_card(flatten(args), options, bot));
      break;
    case 'text':
      options.push("text");
      send(display_card(flatten(args), options, bot));
      break;
    case 'stats':
      options.push("text");
      send(display_card(flatten(args), options, bot));
      break;
    case 'full':
    case 'fullart':
      send(full_art(flatten(args)));
      break;
    case 'find':
      send(find_card(flatten(args)));
      break;
    case 'rate':
      send(rate_card(flatten(args), options, bot));
      break;

    /* Rules */
    case 'faq':
      send(faq(flatten(args)));
      break;
    case 'keyword':
    case 'rule':
    case 'rules':
      if (args.length < 1)
        send(`Please provide a rule, or use **!rulebook** or **!guide**`);
      else
        send(glossary(flatten(args)));
      break;

    /* Documents */
    case 'rulebook':
      send(rulebook(args, options))
      break;
    case 'comprehensive': 
    case 'cr':
      send("<https://drive.google.com/file/d/1BFJ2lt5P9l4IzAWF_iLhhRRuZyNIeCr-/view>");
      break;
    case 'errata':
      send("<https://drive.google.com/file/d/1eVyw_KtKGlpUzHCxVeitomr6JbcsTl55/view>");
      break;
    case 'guide':
      send("<https://docs.google.com/document/d/1WJZIiINLk_sXczYziYsizZSNCT3UUZ19ypN2gMaSifg/view>");
      break;

    /* Starters */
    case 'starter':
    case 'starters':
      if (options.includes("metal")) send(commands["starter"][1]);
      else if (options.includes("king")) send(commands["starter"][2]);
      else send(commands["starter"][1]);
      break;

    /* Banlist and Formats */

    /* Meta and Tierlist */
    case 'tier':
    case 'meta':
      if (args.length == 0) {
        send("Supply a tier or use ``!tierlist``")
        break;
      }
    case 'tierlist':
      if (args.length > 0) {
        if (!bot_commands(channel)) break;
        send(new RichEmbed()
          .setImage('https://drive.google.com/uc?id=1f0Mmsx6tVap7uuMjKGWWIlk827sgsjdh')
        )
        .then(() => {
          send(tier());
        });
      }
      else {
        send(tier(flatten(args)));
      }
      break;

    default:
      break;
  }

  return;
}

/*
* Support Functions
*/

// Takes the arg list and turns it into cleaned text
function flatten(args: string[]): string {
  return cleantext(args.join(" "));
}

function mainserver(guild: Guild | null): boolean {
  if (!guild) return false;
  return (guild.id == servers.main.id);
}

function donate(channel: Channel) {
  channel.send(
    new RichEmbed()
      .setDescription("[Support the development of Chaotic BackTalk](https://www.paypal.me/ChaoticBackup)")
      .setTitle("Donate")
  );
}

function bot_commands(channel: Channel, msg?: string): boolean {
  if (is_channel("main", channel, "bot_commands")) {
    channel.send(msg || "To be curtious to other conversations, ask me in <#387805334657433600> :)");
    return false;
  }
  return true;
}

function help(str?: string) {
  const help = require('./config/help.json');
  let message = "";

  if (str) {
    // detailed help
    if (help.hasOwnProperty(str) && help[str].long) {
      message = "```md\n"
        + help[str].cmd + "\n```"
        + help[str].long;
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

/**
  * Turns the first 'word' after the command character into the `cmd`
  * Merges the remaining array of words into `args`
  * Strips `options` from string and returns as array
  */
function parseCommand(content: string): 
 {cmd: string, args: string[], options: string[]} 
{
  let result: any;

  if (content.charAt(1) == "!") {
    result = (content.substring(2));
  } 
  else {
    result = (content.substring(1));
  }
 
  let cmd = result.split(" ")[0].toLowerCase().trim();

  let options: string[] = [];
  result = result.replace(/(?:--|—)([^\s]+)/g, (match: any, p1: string) => {
    options.push(p1); return "";
  });

  let args = result.split("\n")[0].trim().split(" ").splice(1);

  return {cmd, args, options};
}

/**
 * If the message was sent in a guild, returns the `guild` and `guildMember`
 */
async function messageGuild(message: Message): 
Promise<{guild: Guild | null, guildMember: GuildMember | null}> 
{
  if (!message.guild) return {guild: null, guildMember: null};

  let guild: Guild = message.guild;
  let guildMember: GuildMember = (message.member) 
    ? message.member
    : await guild.fetchMember(message.author).then((member) => guildMember = member);

  return {guild: guild, guildMember: guildMember};
};