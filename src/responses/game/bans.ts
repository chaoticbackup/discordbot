import { Guild } from 'discord.js';
import { can_send, is_channel, rndrsp, uppercase } from '../../common';
import { Channel } from '../../definitions';
import servers from '../../common/servers';
import { API } from '../../database';

import ban_lists from './config/bans.json';
const { formats, watchlist, detailed, reasons, jokes } = ban_lists;

function f() {
  let message = 'Community Formats:\n';

  for (const format in formats) {
    message += `**${uppercase(format)}**: ${formats[format]}\n`;
  }

  return message;
}

export { f as formats };

export function banlist(guild: Guild, channel: Channel, options: string[] = []) {
  if (guild && guild.id === servers('main').id) {
    if ((is_channel(channel, 'gen_1') || is_channel(channel, 'gen_2'))) {
      // eslint-disable-next-line max-len
      return (`I'm excited you want to follow the ban list, but to keep the channel from clogging up, can you ask me in <#${servers('main').channel('bot_commands')}>?`);
    }
  }

  let message = '';

  const title = (_format: string) => {
    message = `**${uppercase(_format)}:**\n${formats[_format]}`;
  };

  const list_bans = (_format: string) => {
    message += '\n==Banned Cards==';
    ban_lists[_format].forEach((key: string) => {
      message += `\n${key}`;
    });
  };

  const format = (options.length === 0) ? 'standard' : options[0].toLowerCase();

  switch (format) {
    // Standard
    case 'standard': {
      title('standard');
      list_bans('standard');
      message += '\n=====\n**Watchlist:** (not banned)';
      watchlist.forEach((key: string) => {
        message += `\n${key}`;
      });
      message += '\n=====\nYou can ask why a card was banned with "!whyban *card name*"';
      break;
    }
    // Legacy
    case 'legacy': {
      title('legacy');
      break;
    }
    // Pauper
    case 'pauper': {
      title('pauper');
      list_bans('pauper');
      break;
    }
    // Noble
    case 'peasant':
    case 'noble': {
      title('noble');
      list_bans('noble');
      break;
    }
    // Modern
    case 'rotation':
    case 'modern': {
      title('modern');
      list_bans('modern');
      break;
    }
    // Advanced Apprentice
    case 'advanced apprentice':
    case 'aap': {
      message = `**Advanced Apprentice (AAP):**\n${formats.aap}`;
      list_bans('aap');
      break;
    }
    default: {
      message = 'Not a supported format';
    }
  }

  return message;
}

export function whyban(
  name: string, guild?: Guild, channel?: Channel, options: string[] = []
): string | undefined {
  if (guild && channel && !options.includes('joke') && !can_send(guild, channel)) return;

  if (!name) return 'Please provide a card or use !banlist';

  const card = API.find_cards_by_name(name)[0] ?? null;

  if (!card) return 'Not a valid card name';

  const cardName = card.gsx$name;

  // Check if long explanation requested
  if (options.includes('detailed')) {
    if (guild && channel && guild.id === servers('main').id) {
      if (!can_send(guild, channel)) return '';
    }
    for (const key in detailed) {
      if (key === cardName) {
        return `*${key}*:\n${detailed[key]}`;
      }
    }
    // Check if its even banned
    for (const key in reasons) {
      if (key === cardName) {
        return `${key} doesn't have a more detailed explanation`;
      }
    }
    return `${cardName} isn't banned`;
  }

  for (const key in reasons) {
    if (key === cardName) {
      if (options.includes('joke')) {
        if (reasons[key].length > 1) {
          return `*${key}*:\n${rndrsp(reasons[key].slice(1, reasons[key].length), key)}`;
        }
        else {
          return `Sorry ${key} doesn't have a joke`;
        }
      }
      else {
        return `*${key}*:\n${reasons[key][0]}`;
      }
    }
  }

  for (const key in jokes) {
    if (key === cardName) {
      return `*${key}*:\n${rndrsp(jokes[key], key)}`;
    }
  }

  return rndrsp(["That card isn't banned", `Oh lucky you, ${cardName} isn't banned`]);
}
