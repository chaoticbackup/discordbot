import { Guild, Message } from 'discord.js';
import { can_send, rndrsp, uppercase, cleantext } from '../../common';
import { Channel } from '../../definitions';
import { API } from '../../database';

import ban_lists from './config/bans.json';
const { formats, detailed, reasons, jokes } = ban_lists;

function f() {
  let message = 'Community Formats:\n';

  for (const format in formats) {
    message += `**${uppercase(format)}**: ${formats[format]}\n`;
  }

  return message;
}

export { f as formats };

export function banlist(message: Message, options: string[] = []) {
  let response = '';

  const title = (_format: string) => {
    response = `**${uppercase(_format)}:**\n${formats[_format]}`;
  };

  const list_bans = (_format: string) => {
    // response += '\n==Banned Cards==';
    response += '**April Fools Ban List:**\n=====';
    ban_lists[_format].forEach((key: string) => {
      response += `\n${key}`;
    });
  };

  const format = (options.length === 0) ? 'standard' : options[0].toLowerCase();

  switch (format) {
    // Standard
    case 'standard': {
      title('standard');
      list_bans('standard');
      // response += '\n=====\n**Watchlist:** (not banned)';
      // watchlist.forEach((key: string) => {
      //   response += `\n${key}`;
      // });
      response += '\n=====\nYou can ask why a card was banned with "!whyban *card name*"';
      break;
    }
    // Legacy
    case 'unrestricted':
    case 'legacy': {
      title('unrestricted');
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
      response = `**Advanced Apprentice (AAP):**\n${formats.aap}`;
      list_bans('aap');
      break;
    }
    default: {
      response = 'Not a supported format';
    }
  }

  return response;
}

export function whyban(
  name: string, channel: Channel, guild?: Guild, options: string[] = []
): string | undefined {
  if (!name) return 'Please provide a card or use !banlist';

  const card = API.find_cards_ignore_comma(name)[0] ?? null;

  if (card) {
    const cardName = card.gsx$name;

    // Check if long explanation requested
    if (options.includes('detailed')) {
      if (!Object.keys(reasons).includes(cardName)) {
        return `${cardName} isn't banned`;
      }

      // if (!(can_send(channel, guild))) return;

      if (Object.keys(detailed).includes(cardName)) {
        return `*${cardName}*:\n${detailed[cardName]}`;
      }

      if (Object.keys(reasons).includes(cardName)) {
        return `${cardName} doesn't have a more detailed explanation`;
      }
    }

    if (Object.keys(reasons).includes(cardName)) {
      if (options.includes('joke')) {
        if (reasons[cardName].length > 1) {
          return `*${cardName}*:\n${rndrsp(reasons[cardName].slice(1, reasons[cardName].length), cardName)}`;
        }
        else {
          return `Sorry ${cardName} doesn't have a joke entry`;
        }
      }
      else {
        if (!can_send(channel, guild)) return;

        return `*${cardName}*:\n${reasons[cardName][0]}`;
      }
    }
  }

  for (const key of Object.keys(jokes)) {
    if (cleantext(key).includes(cleantext(name))) {
      return `*${key}*:\n${rndrsp(jokes[key], key)}`;
    }
  }

  if (!card) {
    return 'Not a valid card name';
  }

  return rndrsp([`${card.gsx$name} isn't banned`, `Oh lucky you! ${card.gsx$name} isn't banned`]);
}
