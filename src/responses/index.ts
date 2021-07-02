/* eslint-disable @typescript-eslint/return-await */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { Client, DiscordAPIError, DMChannel, Message, RichEmbed } from 'discord.js';

import { can_send, cleantext, donate, flatten, hasPermission, isModerator, is_channel, msgCatch } from '../common';
import debug from '../common/debug';
import parseCommand from '../common/parseCommand';
import { messageGuild } from '../common/parseMessageGuild';
import servers from '../common/servers';

import { Channel, SendFunction } from '../definitions';

import { clear, haxxor, logs, rm } from './admin';

import { avatar, display_card, display_token, find_card, full_art } from './card';

import commands from './command_help.json';

import { banlist, formats, whyban } from './game/bans';
import { decklist, tier, tierlist } from './game/decklists';
import { cr, faq } from './game/faq';
import glossary from './game/glossary';
import { funstuff, goodstuff } from './game/goodstuff';
import rulebook from './game/rulebook';
import starters from './game/starters';

import { all_commands, help_command, help_list } from './help';

import color from './joinable/color';
import { cancelMatch, lookingForMatch } from './joinable/match_making';
import meetup from './joinable/regions';
import speakers from './joinable/speakers';
import { brainwash, tribe } from './joinable/tribes';

import gone from './misc/gone';
import { compliment, insult } from './misc/insult_compliment';
import joke from './misc/joke';
import { make, menu, order } from './misc/menu';
import { missing_cards } from './misc/missing_cards';
import nowornever from './misc/nowornever';
import { answer, trivia, whistle } from './misc/trivia';
import watch from './misc/watch';

import rate_card from './rate';
import checkSass from './sass';

const development = (process.env.NODE_ENV === 'development');

// Servers which have access to the full command list
const full_command_servers = [
  servers('main').id, servers('develop').id, servers('unchained').id
];

export default (async function (bot: Client, message: Message): Promise<void> {
  // Ignore bot messages
  if (message.author.bot) return;

  const { content } = message;
  const mentions: string[] = Array.from(message.mentions.users.keys());

  // Prevents sending an empty message
  const send: SendFunction = async (msg, options) => {
    if (msg) return message.channel.send(msg, options).catch(msgCatch);
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
    // Send Error to Bot Testing Server
    const server_source = message.guild ? message.guild.name : 'DM';

    debug(bot, `${server_source}:\n${error.message}\n${error.stack}`, 'errors');

    if (development) return;

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
  const { content } = message;

  const { cmd, args, options } = parseCommand(content);

  if (options.includes('help'))
    return send(help_command(cmd));

  const { channel } = message;
  const { guild, guildMember } = await messageGuild(message);

  const parseCards = (args: string[], opts: string[]): void => {
    return flatten(args).replace(/\[/g, '').split(';').forEach((name: string) => {
      send(display_card(name.trim(), opts, bot));
    });
  };

  /**
    * Public Servers (Limited functions)
    */
  if (guild && !full_command_servers.includes(guild.id)) {
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
      case 'image':
        return parseCards(args, ['image']);
      case 'full':
      case 'fullart':
        return send(full_art(flatten(args), options));
      case 'find':
        return send(find_card(flatten(args)));
      case 'rate':
        return send(rate_card(flatten(args), options, bot));
      case 'faq':
        return send(faq(flatten(args)));
      case 'keyword':
      case 'rule':
        if (args.length < 1) {
          return send('Please provide a rule, or use **!rulebook** or **!guide**');
        } else {
          return send(glossary(flatten(args)));
        }
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
        return send('<https://docs.google.com/document/d/1WJZIiINLk_sXczYziYsizZSNCT3UUZ19ypN2gMaSifg/view>');
      case 'banlist': {
        const rsp = (options.length === 0 && args.length > 0)
          ? banlist(message, [flatten(args)])
          : banlist(message, options);
        return send(rsp);
      }
      case 'ban':
      case 'whyban':
        return send(whyban(flatten(args), channel, guild, guildMember, options));
      case 'help':
        if (content.charAt(0) === '!')
          return send('Use **!commands** or **c!help**');
        // falls through with c!help
      case 'commands':
        const text = flatten(args);
        if (text) return send(help_command(text));
        const keys = [
          'card', 'stats', 'text', 'image', 'ability', 'fullart', 'find',
          'rate', 'faq', 'rule', 'rm', 'documents', 'banlist', 'whyban'
        ];
        return send(help_list(keys));
      case 'rm':
        if (isNaN(parseInt(flatten(args))))
          return rm(message, guild);
        return;
      case 'donate':
        return send(donate());
      default:
        return;
    }
  }

  function newMemberGeneralChatSpam() {
    return (guild && guildMember && guildMember.roles.size === 1 && guild.id === servers('main').id &&
      (channel.id === servers('main').channel('gen_1') || channel.id === servers('main').channel('gen_2'))
    );
  }

  async function sendBotCommands(content: Array<string | RichEmbed>, msg: string | null = null) {
    let ch = message.channel as Channel;
    if (!can_send(channel, guild, guildMember, msg)) {
      content.unshift(`<@!${message.author.id}>`);
      ch = bot.channels.get(servers('main').channel('bot_commands')) as Channel;
    }

    for await (const c of content) {
      if (c) await ch.send(c).catch((e) => { throw (e); });
    }
  }

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
      if (newMemberGeneralChatSpam()) return;
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
    case 'image':
      return parseCards(args, ['image']);
    case 'full':
    case 'fullart':
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
      if (args.length < 1) {
        return send('Please provide a rule, or use **!rulebook** or **!guide**');
      } else {
        return sendBotCommands([glossary(flatten(args))]);
      }

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
    case 'banlist': {
      const rsp = (options.length === 0 && args.length > 0)
        ? banlist(message, [flatten(args)])
        : banlist(message, options);
      const msg = !is_channel(message, 'banlist_discussion')
        ? `I'm excited you want to follow the ban list, but to keep the channel from clogging up, can you ask me in <#${servers('main').channel('bot_commands')}>?`
        : null;
      return sendBotCommands([rsp], msg);
    }

    case 'formats':
      return send(formats());
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
      return send(whyban(flatten(args), channel, guild, guildMember, options));

    /* Goodstuff */
    case 'strong':
    case 'good':
    case 'goodstuff':
      return send(goodstuff(args));

    /* Decklists and Tierlist */
    case 'deck':
    case 'decks':
    case 'decklist':
      return sendBotCommands([decklist(flatten(args))]);

    case 'tier': {
      const output = tier(cleantext(flatten(args)));
      if (output instanceof RichEmbed) send(output);
      return;
    }

    case 'tierlist':
    case 'tiers':
      return sendBotCommands([tierlist(), donate()]);

    /* Matchmaking */
    case 'cupid':
      return send(lookingForMatch('recode', channel, guild, guildMember));
    case 'if':
    case 'lf':
    case 'lookingfor':
    case 'match':
      return send(lookingForMatch(args[0], channel, guild, guildMember));
    case 'cancel':
      return send(cancelMatch(args[0], channel, guild, guildMember));

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
      if (args.length > 0 && args[0] === 'tutorial') {
        return send('https://www.youtube.com/watch?v=Djxp6OVbHmI');
      }
      if (args.length > 0 && args[0] === 'missing') {
        return sendBotCommands([missing_cards()]);
      }
      return send('https://chaoticrecode.com/');

    case 'forum':
      if (args.length > 0 && args[0] === 'decks') {
        return send('https://chaoticbackup.forumotion.com/f11-deck-building/');
      }
      return send('https://chaoticbackup.forumotion.com/');

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

    /* Languages */
    case 'speak':
    case 'speaker':
    case 'speakers':
    case 'language':
    case 'languages':
      return speakers(message, args, guild, guildMember).then(send);

    /* Regions/Meetups */
    case 'region':
    case 'regions':
      return meetup(message, args, mentions, guild, guildMember).then(send);

    /* Tribes */
    case 'tribe':
      return tribe(args, guild, guildMember).then(send);
    case 'assimilate':
      return tribe(['join', 'assimilate'], guild, guildMember).then(send);
    case 'bw':
    case 'brainwash':
      return brainwash(mentions, guild, guildMember).then(send);

    /* Color Roles */
    case 'colour':
    case 'color':
      return color(args, guild, guildMember, send);

    /* Now or Never */
    case 'never':
    case 'nowornever':
    case 'non':
      return send(nowornever(flatten(args)));

    /* Gone Chaotic (fan) */
    case 'gone':
    case 'fan':
    case 'unset':
      return send(gone(flatten(args), bot, options));

    /* Compliments, Insults, Jokes */
    case 'flirt':
    case 'compliment':
      return send(compliment(mentions, args.join(' '), guild));
    case 'burn':
    case 'roast':
    case 'insult':
      return send(insult(mentions, args.join(' '), guild));
    case 'joke':
      return send(joke(args.join(' ').toLowerCase()));

    /* Trivia */
    case 'whistle':
      return whistle(guildMember).then(send);
    case 'trivia':
      return send(trivia(guildMember));
    case 'answer':
      return send(answer(guildMember ?? message.author, args.join(' ')));

    /* Happy Borth Day */
    case 'happy': {
      if (cleantext(flatten(args)).includes('borth'))
        send(gone('borth-day', bot, options));
      return;
    }

    /* Watch playlists */
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
      return;
    }

    case 'map': {
      if (args.length > 0) {
        if (args[0].toLowerCase() === 'overworld') {
          return send('<https://cdn.discordapp.com/attachments/135657678633566208/617384989641801897/OW-Map-0518.jpg>');
        } else
        if (args[0].toLowerCase() === 'underworld') {
          return send('<https://cdn.discordapp.com/attachments/135657678633566208/617385013129773057/UW-Map-0517.jpg>');
        }
      }
      return send(commands.map.cmd);
    }

    /* Help */
    case 'help':
      if (guildMember && content.charAt(0) === '!') {
        const rtn_str = 'Use **!commands** or **c!help**';
        if (bot.users.get('159985870458322944')) // meebot
          setTimeout(() => { send(rtn_str); }, 500);
        else
          send(rtn_str);
        return;
      } // falls through with c!help
    case 'cmd':
    case 'command':
    case 'commands': {
      if (args.length > 0 && mentions.length === 0) {
        return send(help_command(flatten(args), guildMember));
      }
      if (guildMember) {
        let gm = guildMember;
        if (mentions.length > 0 && isModerator(guildMember)) {
          gm = await message.guild.fetchMember(mentions[0]);
        }
        return gm.send(help_list())
        .then(() => {
          send(`I messaged ${gm.displayName} the command list`);
        })
        .catch((e: DiscordAPIError) => {
          // eslint-disable-next-line eqeqeq
          if (e.code == 50007) {
            // If cannot DM send in channel
            sendBotCommands([help_list()]);
          }
          else {
            throw (e);
          }
        });
      }
      return sendBotCommands([help_list()]);
    }
    case 'everything':
      if (guildMember) guildMember.send(all_commands(guildMember));
      else if (message.channel instanceof DMChannel) send(all_commands());
      return;

    /*
   * Moderation
   */
    case 'banhammer': {
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
      return send(display_card('The Doomhammer', ['image'], bot));
    }

    case 'rm':
      if (isNaN(parseInt(flatten(args))))
        return rm(message, guild);
    // fallthrough if number provided
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
