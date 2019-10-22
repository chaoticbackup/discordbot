import {RichEmbed, Message, Guild, Client, GuildMember} from 'discord.js';
import { Logger } from 'winston';
import {Channel, SendFunction} from './js/definitions';

const {starter, joke} = require('./config/commands.json');
const {servers, users} = require('./config/server_ids.json');

import {
    API,
    can_send, cleantext, rndrsp, isModerator, hasPermission, is_channel,
    rate_card, full_art, find_card, display_card, ability_only,
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
    glossary,
    gone, nowornever,
    compliment, insult
} from './js';

const development = (process.env.NODE_ENV == "development");

export default (async function(message: Message, logger: Logger) {
  //Ignore bot messages
  if (message.author.bot) return;
  // No Dev on Main Server
  if (development && (!message.guild || (message.guild.id == servers.main.id))) return;

  //@ts-ignore
  const bot: Client = this; 
  let content: string = message.content;
  const mentions: string[] = Array.from(message.mentions.users.keys());
  
  // Prevents sending an empty message
  const send: SendFunction = (msg, options) => {
    if (msg) return message.channel.send(msg, options).catch(error => logger.error(error.stack))
    return Promise.resolve();
  }

  try {
    // Dev command prefix
    if (development && content.substring(0, 2) == "d!") {
      return command_response(bot, mentions, message, send);
    }
    
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
    send(checkSass(message, mentions));

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

/**
 * Switch statement for commands 
 * @param bot 
 * @param mentions 
 * @param message 
 * @param send 
 */
const command_response = async (bot: Client, mentions: string[], message: Message, send: SendFunction): Promise<void> => {
  
  let content: string = message.content;

  // strip prefix from test commands
  if (development && content.charAt(0) == "d") {
    content = content.slice(1);
  }

  const {cmd, args, options} = parseCommand(content);

  if (options.includes("help")) {
    return send(help(cmd));
  }

  /**
    * Trading Server (Limited functions)
    */
  if (message.guild && message.guild.id == servers.trading.id) {
    let text = flatten(args);
    switch(cmd) {
      case 'card':
        return send(display_card(text, options, bot));
      case 'find':
        return send(find_card(text));
      case 'rate':
        return send(rate_card(text, options, bot));
      case 'help':
        if (content.charAt(0) == "!") {
          return send("Use **!commands** or **c!help**");
        } // falls through with c!help
      case 'commands':
        if (text) return send(help(text));
        return send("```md\n!card <card>\n!find <text>\n" +
          "!rate <Creature> <Courage> <Power> <Wisdom> <Speed> <Energy>\n```"
        );
    }
    return;
  }

  const channel = message.channel;
  const {guild, guildMember} = <{guild: Guild, guildMember: GuildMember}> await messageGuild(message);

  /** 
    * International Server only
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
  /*
   * Gameplay
   */

    /* Cards */
   case 'card':
   case 'cards':
      if (guildMember && guildMember.roles.size === 1 && !can_send(message)) break;
      return flatten(args).split(";").forEach((name: string) => {
        send(display_card(name.trim(), options, bot));
      });
    case 'ability':
      return send(ability_only(flatten(args), options));
    case 'text':
      options.push("text");
      return send(display_card(flatten(args), options, bot));
    case 'stats':
      options.push("stats");
      return send(display_card(flatten(args), options, bot));
    case 'full':
    case 'fullart':
      return send(full_art(flatten(args)));
    case 'find':
      return send(find_card(flatten(args)));
    case 'rate':
      return send(rate_card(flatten(args), options, bot));
    case 'readthecard': {
      if (isModerator(guildMember) && hasPermission(guild, "SEND_TTS_MESSAGES")) {
        return send(ability_only(flatten(args), options), {tts: true});
      }
    } return;

    /* Rules */
    case 'faq':
      return send(faq(flatten(args)));
    case 'keyword':
    case 'rule':
      if (args.length < 1)
        return send(`Please provide a rule, or use **!rulebook** or **!guide**`);
      return send(glossary(flatten(args)));

    /* Documents */
    case 'rulebook':
      return send(rulebook(args, options));
    case 'cr':
    case 'comprehensive': 
      return send("<https://drive.google.com/file/d/1BFJ2lt5P9l4IzAWF_iLhhRRuZyNIeCr-/view>");
    case 'errata':
      return send("<https://drive.google.com/file/d/1eVyw_KtKGlpUzHCxVeitomr6JbcsTl55/view>");
    case 'guide':
      return send("<https://docs.google.com/document/d/1WJZIiINLk_sXczYziYsizZSNCT3UUZ19ypN2gMaSifg/view>");

    /* Starters */
    case 'starter':
    case 'starters':
      if (options.includes("metal")) 
        return send(starter[1]);
      else if (options.includes("king")) 
        return send(starter[2]);
      return send(starter[1]);

    /* Banlist and Formats */
    case 'banlist':
      return send(banlist(guild, channel, options));
    case 'legacy':
    case 'standard':
      return send(banlist(guild, channel));
    case 'rotation':
    case 'modern':
      return send(banlist(guild, channel, ["modern"]));
    case 'pauper':
      return send(banlist(guild, channel, ["pauper"]));
    case 'peasant':
    case 'noble':
      return send(banlist(guild, channel, ["nobel"]));

    /* Whyban */
    case 'ban':
      if (mentions.length > 0) {
        if (mentions.indexOf('279331985955094529') !== -1)
          return send("You try to ban me? I'll ban you!");
        return send("I'm not in charge of banning players");
      } //fallthrough
    case 'whyban':
      if (mentions.length > 0)
        return send("Player's aren't cards, silly");
      return send(whyban(flatten(args), guild, channel, options));

    /* Goodstuff */
    case 'best': 
      return send("Use !good"); // TODO deprecate
    case 'strong':
    case 'good':
    case 'goodstuff':
      return send(goodstuff(args));

    /* Meta and Tierlist */
    case 'tier':
    case 'meta':
      if (args.length == 0)
        return send("Supply a tier or use ``!tierlist``")
      // falls through if args
    case 'tierlist': {
      if (args.length > 0) return send(tier(flatten(args)));
      if (can_send(message)) {
        return send(new RichEmbed()
          .setImage('https://drive.google.com/uc?id=1f0Mmsx6tVap7uuMjKGWWIlk827sgsjdh')
        )
        .then(() => send(tier()))
        .then(() => send(donate()));
      }
    } break;

    /* Matchmaking */
    case "lf":
    case 'lookingfor':
    case "match":
      return send(lookingForMatch(args[0], channel, guild, guildMember));
    case "cancel":
      return send(cancelMatch(channel, guild, guildMember));
    
  /*
   * Misc
   */
    case 'donate':
      return send(donate());

    case 'collection':
      return send("https://chaoticbackup.github.io/collection/");

    case 'fun':
    case 'funstuff':
    case 'agame':
      return send(funstuff());  

    /* Cooking */
    case 'menu':
      return send(menu());
    case 'order':
      return send(order(flatten(args)));
    case 'make':
    case 'cook':
      if (flatten(args) === "sandwitch")
        return send(display_card("Arkanin", options, bot));
      else
        return send(make(flatten(args)));
    
    /* Tribes */
    case 'tribe':
      return tribe(guild, guildMember, args).then(send);
    case 'bw':
    case 'brainwash':
      return brainwash(guild, guildMember, mentions).then(send);

    /* Languages */
    case 'speak':
    case 'speaker':
    case 'speakers':
    case 'language':
    case 'languages':
      return speakers(guildMember, guild, args).then(send);

    /* Now or Never */
    case 'never':
    case 'nowornever':
      return send(nowornever(flatten(args)));

    /* Gone Chaotic (fan) */
    case 'gone':
    case 'fan':
    case 'unset':
      return send(gone(flatten(args), bot));

    /* Compliments, Insults, Jokes */
    case 'flirt':
    case 'compliment':
      return send(compliment(guild, mentions, args.join(" ")));
    case 'burn':
    case 'roast':
    case 'insult':
      return send(insult(guild, mentions, args.join(" ")));
    case 'joke':
      return send(rndrsp(joke, "joke"));

    /* Help */
    case 'help':
      if (content.charAt(0) == "!") {
        let rtn_str = "Use **!commands** or **c!help**";
        if (guild && guild.id == servers.main.id && !is_channel("main", channel, "bot_commands")) {
          rtn_str += " in <#387805334657433600>";
        }
        if (bot.users.get('159985870458322944')) //meebot
          setTimeout(() => send(rtn_str), 500);
        else
          send(rtn_str);
        break;
      } // falls through with c!help
    case 'commands': {
      if (args.length > 0) return send(help(flatten(args)));
      if (can_send(message)) {
        return send(help())
        .then(() => send(donate()));
      }
    } break;
      
  /*
   * Moderation
   */
  case 'rm':
    if (isNaN(parseInt(flatten(args))))
      return rm(bot, message);
    // fallthrough if number provided
  case 'clear':
  case 'clean':
  case 'delete':
    return clear(parseInt(flatten(args)), message, mentions);

  /* Hard reset bot */
  case 'haxxor':
    return haxxor(message, bot);

  // Not a recognized command
  default: break;
  }
}

/*
* Support Functions
*/

// Takes the arg list and turns it into cleaned text
function flatten(args: string[]): string {
  return (args.join(" ")).toLowerCase();
}

function donate(): RichEmbed {
  return(
    new RichEmbed()
      .setDescription("[Support the development of Chaotic BackTalk](https://www.paypal.me/ChaoticBackup)")
      .setTitle("Donate")
  );
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
  let result: string;

  if (content.charAt(1) == "!") {
    result = (content.substring(2));
  } 
  else {
    result = (content.substring(1));
  }
 
  let cmd = result.split(" ")[0].toLowerCase();

  let options: string[] = [];
  result = result.replace(/(?:--|—)([^\s]+)([ \t]*)/g, (_match: any, p1: string) => {
    options.push(p1); return "";
  });

  // only looks at first line for input
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

function rm(bot: Client, message: Message) {
  let lstmsg = bot.user.lastMessage;
  if (lstmsg && lstmsg.deletable) lstmsg.delete();
  if (message.deletable) message.delete(); // delete user msg
}

function clear(amount: number, message: Message, mentions: string[] = []): void {
  if (isModerator(message.member) && hasPermission(message.guild, "MANAGE_MESSAGES")) {
    if (amount <= 25) {
      if (mentions.length > 0) {
        message.channel.fetchMessages()
        .then(messages => {
          let b_messages = messages.filter(m =>
            mentions.includes(m.author.id)
          );
          if (b_messages.size > 0)
            message.channel.bulkDelete(b_messages);
            message.delete();
        });
      }
      else {
        message.channel.bulkDelete(amount + 1);
      }
    }
    else {
      // only delete the clear command
      message.channel.send("Enter a number less than 20");
      message.delete();
    }
  }
}

function haxxor(message: Message, bot: Client): void {
  if (message.member.id === users.daddy
    || (message.guild && message.guild.id === servers.main.id && isModerator(message.member))
  ) {
    message.channel.send('Resetting...');
    API.rebuild()
    .then(() => bot.destroy())
    .catch((err) => {
      message.channel.send(err.message);
    });
  }
}