import { Guild, GuildMember, Message } from 'discord.js';

import { can_send, rndrsp, uppercase, cleantext } from '../../common';
import { API } from '../../database';
import { Channel } from '../../definitions';

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

export function banlist_update(message: Message) {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  const date = message.createdAt.toLocaleDateString('en-US', options);
  let response = `**Standard (${date})**\n==**Banned Cards**==`;
  response += (ban_lists.standard).reduce((prev, curr) => `${prev}\n${curr}`, '');
  response += '\n==**Unique Cards**==';
  response += (ban_lists.unique).reduce((prev, curr) => `${prev}\n${curr}`, '');
  return response;
}

export function banlist(message: Message, options: string[] = []) {
  let response = '';

  const title = (_format: string) => {
    response = `**${uppercase(_format)}:**\n${formats[_format]}`;
  };

  const list_bans = (_format: string, header = '\n==**Banned Cards**==') => {
    response += header;
    response = (ban_lists[_format] as string[]).reduce((prev, curr) => `${prev}\n${curr}`, response);
  };

  const format = (options.length === 0) ? 'standard' : options[0].toLowerCase();

  switch (format) {
    // Standard
    case 'standard': {
      title('standard');
      list_bans('standard');
      response += '\n==**Unique** (only 1 copy allowed)==';
      list_bans('unique', '');
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
      // can't use title() because it is abbreviated
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
  name: string, channel: Channel, guild?: Guild, guildMember?: GuildMember, options: string[] = []
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

      if (!can_send({ channel, guild, guildMember })) return;

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
        if (!can_send({ channel, guild, guildMember })) return;

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
