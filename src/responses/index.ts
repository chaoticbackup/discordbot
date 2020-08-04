import NodeJS from 'process';
/* eslint-disable @typescript-eslint/return-await */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { Client, Guild, GuildMember, Message, RichEmbed, DMChannel } from 'discord.js';

import logger from '../logger';

import { can_send, hasPermission, isModerator, rndrsp, cleantext, flatten, donate } from '../common';
import servers from '../common/servers';
import users from '../common/users';
import parseCommand from '../common/parse_command';

import { API } from '../database';
import { SendFunction } from '../definitions';

import { display_card, find_card, full_art, display_token, avatar } from './card';
import rate_card from './rate';

import { banlist, formats, whyban } from './game/bans';
import { cr, faq } from './game/faq';
import glossary from './game/glossary';
import { funstuff, goodstuff } from './game/goodstuff';
import { cancelMatch, lookingForMatch } from './joinable/match_making';
import { tierlist, decklist } from './game/decklists';
import rulebook from './game/rulebook';
import starters from './game/starters';

import meetup from './joinable/regions';
import speakers from './joinable/speakers';
import { brainwash, tribe } from './joinable/tribes';
import color from './joinable/color';

import gone from './misc/gone';
import help from './misc/help';
import { compliment, insult } from './misc/insult_compliment';
import { whistle, trivia, answer } from './misc/trivia';
import { make, menu, order } from './misc/menu';
import nowornever from './misc/nowornever';
import watch from './misc/watch';

import checkSass from './sass';
import logs from './logs';
import debug from '../common/debug';

import joke from './misc/config/jokes.json';

const development = (process.env.NODE_ENV === 'development');

// Servers which have access to the full command list
const full_command_servers = [
  servers('main').id, servers('develop').id, servers('international').id, servers('unchained').id
];

export default (async function (bot: Client, message: Message): Promise<void> {
  // Ignore bot messages
  if (message.author.bot) return;

  const content: string = message.content;
  const mentions: string[] = Array.from(message.mentions.users.keys());

  // Prevents sending an empty message
  const send: SendFunction = async (msg, options) => {
    if (msg) return message.channel.send(msg, options).catch(error => { logger.error(error.stack); });
  };

  const response = async (): Promise<void> => {
    // Dev command prefix
    if (development && content.substring(0, 2) === 'd!')
      return command_response(bot, message, mentions, send);

    // Prevents double bot responses on production servers
    if (development && (!message.guild || message.guild.id !== servers('develop').id))
      return;

    // If the message is a command
    if (content.charAt(0) === '!' || content.substring(0, 2).toLowerCase() === 'c!')
      return command_response(bot, message, mentions, send);

    // If no commands check message content for quips
    if (message.guild &&
      (message.guild.id === servers('main').id || message.guild.id === servers('develop').id)
    ) return checkSass(bot, message, mentions, send);
  };

  return response()
  .catch((error) => {
    // Log/Print error
    logger.error(error.stack);

    // Don't log problems while in development
    if (development) return;

    // Send Error to Bot Testing Server
    const server_source = message.guild ? message.guild.name : 'DM';

    debug(bot, `${server_source}:\n${error.stack}`, 'errors');

    // Ignore programmer errors (keep running)
    if (error.name === 'ReferenceError' || error.name === 'SyntaxError')
      return;

    // restart bot if unknown error
    bot.destroy();
  });
});

/**
 * Switch statement for commands
 * @param bot
 * @param mentions
 * @param message
 * @param send
 */
const command_response = async (bot: Client, message: Message, mentions: string[], send: SendFunction): Promise<void> => {
  const content: string = message.content;

  const { cmd, args, options } = parseCommand(content);

  if (options.includes('help'))
    return send(help(cmd));

  const parseCards = (args: string[], opts: string[]): void => {
    return flatten(args).split(';').forEach((name: string) => {
      send(display_card(name.trim(), opts, bot));
    });
  };

  /**
    * Public Servers (Limited functions)
    */
  if (message.guild && !full_command_servers.includes(message.guild.id)) {
    switch (cmd) {
      case 'card':
      case 'cards':
        return parseCards(args, options);
      case 'ability':
        options.push('ability');
        return parseCards(args, options);
      case 'text':
        options.push('text');
        return parseCards(args, options);
      case 'stats':
        options.push('stats');
        return parseCards(args, options);
      case 'full':
      case 'fullart':
        return send(full_art(flatten(args), options));
      case 'find':
        return send(find_card(flatten(args)));
      case 'rate':
        return send(rate_card(flatten(args), options, bot));
      case 'help':
        if (content.charAt(0) === '!')
          return send('Use **!commands** or **c!help**');
        // falls through with c!help
      case 'commands':
        const text = flatten(args);
        if (text) return send(help(text));
        const keys = ['start', 'card', 'stats', 'text', 'fullart', 'find', 'rate', 'end'];
        const msg = `${help('', keys)
        }\nFor my full feature set check out the main server https://discord.gg/chaotic`;
        return send(msg)
        .then(async () => send(donate()));
      case 'rm':
        if (isNaN(parseInt(flatten(args))))
          return rm(message.guild, message);
        break;
      case 'donate':
        return send(donate());
      default:
        return;
    }
  }

  const channel = message.channel;
  const { guild, guildMember } = await messageGuild(message) as {guild: Guild, guildMember: GuildMember};

  /**
    * Full command set
    */
  switch (cmd) {
  /*
   * Gameplay
   */

    /* Cards */
    case 'card':
    case 'cards':
      if (guildMember && guildMember.roles.size === 1 && !can_send(message)) break;
      return parseCards(args, options);
    case 'ability':
      options.push('ability');
      return parseCards(args, options);
    case 'text':
      options.push('text');
      return parseCards(args, options);
    case 'stats':
      options.push('stats');
      return parseCards(args, options);
    case 'full':
    case 'fullart':
      return send(full_art(flatten(args), options));
    case 'altart':
      options.push('alt');
      return send(full_art(flatten(args), options));
    case 'cutout':
    case 'avatar':
      return send(avatar(flatten(args)));
    case 'find':
      return send(find_card(flatten(args)));
    case 'rate':
      return send(rate_card(flatten(args), options, bot));
    case 'readthecard':
      if (isModerator(guildMember) && hasPermission(guild, 'SEND_TTS_MESSAGES')) {
        options.push('read');
        return send(display_card(flatten(args), options, bot), { tts: true });
      }
      return;
    case 'parasite': {
      if (args[0] === 'token')
        return send(display_token(`parasite ${flatten(args.slice(1))}`));

      else
        return send(display_token(`parasite ${flatten(args)}`));
    }
    case 'token': {
      return send(display_token(flatten(args)));
    }

    /* Rules */
    case 'faq':
      return send(faq(flatten(args)));
    case 'keyword':
    case 'rule':
      if (args.length < 1)
        return send('Please provide a rule, or use **!rulebook** or **!guide**');
      return send(glossary(flatten(args)));

    /* Documents */
    case 'rulebook':
      return send(rulebook(args, options));
    case 'rulebooks':
      return send(rulebook([], ['list']));
    case 'cr':
      if (args.length > 0) {
        return send(cr(flatten(args)));
      } // fallthrough
    case 'comprehensive':
      return send('<https://drive.google.com/file/d/1BFJ2lt5P9l4IzAWF_iLhhRRuZyNIeCr-/view>');
    case 'errata':
      return send('<https://drive.google.com/file/d/1eVyw_KtKGlpUzHCxVeitomr6JbcsTl55/view>');
    case 'guide':
      if (flatten(args) === 'untap')
        return send('<https://docs.google.com/document/d/1Tyz3o-XU7jXhFmbNBolUxpxKtr35RM_42C6bapUf9Ak/view>');
      return send('<https://docs.google.com/document/d/1WJZIiINLk_sXczYziYsizZSNCT3UUZ19ypN2gMaSifg/view>');

    /* Starters */
    case 'starter':
    case 'starters':
      return send(starters(message, options));

    /* Banlist and Formats */
    case 'formats':
      return send(formats());

    case 'banlist':
      if (options.length === 0 && args.length > 0)
        return send(banlist(guild, channel, [flatten(args)]));
      return send(banlist(guild, channel, options));
    case 'standard': // return send(banlist(guild, channel));
    case 'legacy': // return send(banlist(guild, channel, ['legacy']));
    case 'modern': // return send(banlist(guild, channel, ['modern']));
    case 'pauper': // return send(banlist(guild, channel, ['pauper']));
    case 'noble': // return send(banlist(guild, channel, ['noble']));
      return send(`Use \`\`!banlist ${cmd}\`\``);

    /* Whyban */
    case 'ban':
      if (mentions.length > 0) {
        if (mentions.includes('279331985955094529'))
          return send("You try to ban me? I'll ban you!");
        return send("I'm not in charge of banning players");
      } // fallthrough
    case 'whyban':
      if (mentions.length > 0)
        return send("Player's aren't cards, silly");
      return send(whyban(flatten(args), guild, channel, options));

    /* Goodstuff */
    case 'strong':
    case 'good':
    case 'goodstuff':
      return send(goodstuff(args));

    /* Decklists and Tierlist */
    case 'deck':
    case 'decks':
    case 'decklist':
      return send(decklist(flatten(args)));
    case 'tierlist':
      if (can_send(message)) {
        return send(tierlist())
        .then(async () => send(donate()));
      }
      return;

    /* Matchmaking */
    case 'cupid':
      return send(lookingForMatch('recode', channel, guild, guildMember));
    case 'if':
    case 'lf':
    case 'lookingfor':
    case 'match':
      return send(lookingForMatch(args[0], channel, guild, guildMember));
    case 'cancel':
      return send(cancelMatch(channel, guild, guildMember));

    /*
   * Misc
   */
    case 'donate':
      return send(donate());

    case 'collection':
      return send('https://chaoticbackup.github.io/collection/');

    case 'portal':
      return send('https://chaoticbackup.github.io/portal/');

    case 'recode':
      return send('https://chaoticrecode.com/');

    case 'banhammer': {
      return send(display_card('The Doomhammer', ['image'], bot));
    }

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
      if (flatten(args) === 'sandwitch')
        return send(display_card('Arkanin', ['image'], bot));
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
      return send(gone(flatten(args), bot, options));

    /* Compliments, Insults, Jokes */
    case 'flirt':
    case 'compliment':
      return send(compliment(guild, mentions, args.join(' ')));
    case 'burn':
    case 'roast':
    case 'insult':
      return send(insult(guild, mentions, args.join(' ')));
    case 'joke':
      return send(rndrsp(joke, 'joke'));

    /* Trivia */
    case 'whistle':
      return whistle(guildMember).then(send);
    case 'trivia':
      return send(trivia(guildMember));
    case 'answer':
      return send(answer(guildMember || message.author, args.join(' ')));

    /* Happy Borth Day */
    case 'happy': {
      if (cleantext(flatten(args)).includes('borth'))
        return send(gone('borth-day', bot, options));
      break;
    }

    /* Color Roles */
    case 'colour':
    case 'color':
      return color(args, guild, guildMember, send);

    /* Regions/Meetups */
    case 'region':
    case 'regions':
      return meetup(guildMember, guild, args, mentions).then(send);

    /* Watch playlists English */
    case 'youtube':
      return send('https://www.youtube.com/channel/UC_fkSCr0z6BY_KMjr-0wkow/playlists');
    case 'watch':
      return send(watch(args, options));

    case 'perim': {
      if (args.length > 0 && args[0] === 'protector') {
        return await send(
          new RichEmbed()
            .setTitle('Click to play Perim Protector')
            .setURL('https://www.newgrounds.com/portal/view/437825')
        ).then(async () =>
          await send('<:kughar:706695875249831946> <:grook:706695825195008052> ' +
          '<:skithia:706695857055072388> <:takinom:706695840940556338> <:chaor:706695811014066186>')
        );
      }
      break;
    }

    /* Help */
    case 'help':
      if (guildMember && content.charAt(0) === '!') {
        const rtn_str = 'Use **!commands** or **c!help**';
        if (bot.users.get('159985870458322944')) // meebot
          setTimeout(() => { send(rtn_str); }, 500);
        else
          send(rtn_str);
        break;
      } // falls through with c!help
    case 'cmd':
    case 'commands': {
      if (args.length > 0) return send(help(flatten(args)));
      if (guildMember) {
        return guildMember.send(help())
        .then(() => { guildMember.send(donate()); })
        .catch(() => {
          send(help());
        });
      }
      return send(help())
      .then(async () => send(donate()));
    }

    /*
   * Moderation
   */
    // case 'banhammer': {
    //   if (isModerator(guildMember) && mentions.length > 1) {
    //     message.mentions.members.forEach(member => {
    //       const reason = args.join(" ");
    //       if (!isModerator(member) && member.bannable) {
    //         if (reason !== "") member.ban({reason});
    //         else member.ban();
    //       }
    //       else {
    //         send(member.displayName + "cannot be banned");
    //       }
    //     });
    //   }
    //   return send(display_card("The Doomhammer", ["image"], bot));
    // }

    case 'rm':
      if (isNaN(parseInt(flatten(args))))
        return rm(guild, message);
    // fallthrough if number provided
    case 'clear':
    case 'clean':
    case 'delete':
      return clear(parseInt(flatten(args)), message, mentions);

      /* Hard reset bot */
    case 'haxxor':
      return haxxor(message);

    case 'logs':
      return send(logs());

      // Not a recognized command
    default:
  }
};

/*
* Support Functions
*/

/**
 * If the message was sent in a guild, returns the `guild` and `guildMember`
 */
async function messageGuild(message: Message):
Promise<{guild: Guild | null, guildMember: GuildMember | null}>
{
  if (!message.guild) return { guild: null, guildMember: null };

  const guild: Guild = message.guild;
  const guildMember: GuildMember = (message.member)
    ? message.member
    : await guild.fetchMember(message.author).then((member) => member);

  return { guild: guild, guildMember: guildMember };
}

function rm(guild: Guild, message: Message) {
  if (message.channel instanceof DMChannel) {
    message.channel.fetchMessages({ limit: 20 })
    .then(messages => {
      const msg = messages.find((msg) => msg.author.id === users('me'));
      if (msg) msg.delete();
    });
    return;
  }
  if (!hasPermission(guild, 'MANAGE_MESSAGES')) return;
  message.channel.fetchMessages({ limit: 10 })
  .then(messages => {
    const msg = messages.find((msg) => msg.author.id === users('me'));
    if (msg) message.channel.bulkDelete([msg, message]);
  });
}

async function clear(amount: number, message: Message, mentions: string[] = []): Promise<void> {
  if ((isModerator(message.member) && hasPermission(message.guild, 'MANAGE_MESSAGES'))) {
    if (amount <= 25) {
      if (mentions.length > 0) {
        return message.channel.fetchMessages()
        .then(messages => {
          const b_messages = messages.filter(m =>
            mentions.includes(m.author.id)
          );
          if (b_messages.size > 0) {
            message.channel.bulkDelete(b_messages);
          }
          message.delete();
        });
      }
      else {
        message.channel.bulkDelete(amount + 1).catch();
      }
    }
    else {
      // only delete the clear command
      message.channel.send('Enter a number less than 20');
      message.delete();
    }
  }
}

function haxxor(message: Message): void {
  if ((message.member?.id === users('daddy') || message.member?.id === users('bf'))
    || (message.guild?.id === servers('main').id && isModerator(message.member))
  ) {
    message.channel.send('Resetting...');
    API.rebuild()
    .then(async () => {
      process.emit('SIGINT', 'SIGINT');
    })
    .catch((err) => {
      debug(err.message, 'errors');
    });
  }
}
