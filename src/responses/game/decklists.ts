import { RichEmbed } from 'discord.js';
import { cleantext } from '../../common';
import { parseTribe } from '../../common/card_types';
import { API } from '../../database';
import { Creature } from '../../definitions';
import { tierlist, decklist, sortedlist, axes, isTier, isType, tiers } from './config/decklists';

function getTiers(input: string) {
  input = input.toUpperCase();

  if (input === 'CM') input = 'S';

  if (isTier(input)) {
    let message = '';

    tierlist[input].forEach((deck: string) => {
      message += `[${deck}](${decklist[deck].url})\n`;
    });
    return (new RichEmbed()).addField(`${input} Decks`, message, true);
  }
}

function getTypes(input: string) {
  let _type = input.charAt(0).toUpperCase() + input.slice(1);

  if (input.toLowerCase() === 'aggrocontrol') _type = 'Aggro-Control';
  else if (input.toLowerCase() === 'controlaggro') _type = 'Midrange';
  else if (input.toLowerCase() === 'antimeta' || input.toLowerCase() === 'meta') _type = 'Anti-Meta';

  if (isType(_type)) {
    const deck_list = [] as string[];
    for (const deck in decklist) {
      const { type, url } = decklist[deck];
      if (type.includes(_type)) deck_list.push(`[${deck}](${url})`);
    }

    let message = `**${_type} Decks:**\n(${axes[_type]})\n\u200B\n`;
    message += deck_list.join('\n');
    return (new RichEmbed()).setDescription(message);
  }
}

function getTribes(input: string) {
  if (input === 'generic' || input === 'tribeless') {
    return getTags('tribeless')!;
  }

  const _tribe = (input === 'frozen') ? 'Mixed' : parseTribe(input, 'Mixed');

  if (_tribe !== undefined) {
    const deck_list = [] as string[];
    for (const deck in decklist) {
      const { tribe, url } = decklist[deck];
      if (_tribe === tribe) deck_list.push(`[${deck}](${url})`);
    }

    let message = `**${_tribe} Decks:**\n`;
    message += deck_list.join('\n');
    return (new RichEmbed()).setDescription(message);
  }
}

function getTags(input: string) {
  const deck_list: string[] = [];

  for (const deck in decklist) {
    const { tags, url } = decklist[deck];

    if (cleantext(deck).includes(input)) {
      deck_list.push(`[${deck}](${url})`);
      continue;
    }

    for (const tag of tags) {
      if (cleantext(tag).includes(input)) {
        deck_list.push(`[${deck}](${url})`);
        break;
      }
    }
  }

  if (deck_list.length > 0) {
    let output = deck_list.join('\n');
    if (output.length > 2000) output = output.slice(0, 1999);
    return (new RichEmbed()).setDescription(output);
  }
}

function getCreatures(input: string) {
  const results = API.find_cards_ignore_comma(input);

  if (results.length === 0) return undefined;

  let card: Creature | undefined;
  const versions: string[] = [];

  results.forEach((c) => {
    if (c.gsx$type === 'Creatures') {
      if (card === undefined) {
        card = c as Creature;
        versions.push(c.gsx$name);
      }
      else if (c.gsx$name.startsWith(card.gsx$name)) {
        versions.push(c.gsx$name);
      }
    }
  });

  if (card === undefined) return;

  const deck_list: string[] = [];

  for (const deck in decklist) {
    const { creatures, url } = decklist[deck];

    if (creatures.some(c => versions.includes(c))) {
      deck_list.push(`[${deck}](${url})`);
    }
  }

  if (deck_list.length > 0) {
    let message = `${card.gsx$name} Decks:\n`;
    message += deck_list.join('\n');
    if (message.length > 2000) message = message.slice(0, 1999);
    return (new RichEmbed()).setDescription(message);
  }
}

function _axes() {
  let rsp = '';

  for (const [key, value] of Object.entries(axes)) {
    rsp += `**${key}**: ${value}\n`;
  }

  return rsp;
}

function getDecklist(input: string): RichEmbed | string {
  let output: RichEmbed | undefined;
  input = cleantext(input);

  if (input.length < 1) {
    return 'Specify a tribe, tier, or keyword to search for decks';
  }

  if (input === 'types') {
    return _axes();
  }

  if (input.length <= 2) {
    if ((output = getTiers(input)) instanceof RichEmbed) {
      return output;
    }
    else {
      return 'Provide at least 3 characters to search for decks';
    }
  }

  if ((output = getTypes(input)) instanceof RichEmbed) {
    return output;
  }

  if ((output = getTribes(input)) instanceof RichEmbed) {
    return output;
  }

  if ((output = getCreatures(input)) instanceof RichEmbed) {
    return output;
  }

  if ((output = getTags(input)) instanceof RichEmbed) {
    return output;
  }

  return "I'm unable to find decks that match your search terms";
}

function getTierlist() {
  const output = new RichEmbed()
    // eslint-disable-next-line max-len
    .setDescription('Disclaimer: This tierlist does not always accurately reflect the meta or present the optimal deck lists. Decks are ordered alphabetically.');
  for (const key of tiers) {
    let message = '';
    let cont = false;
    tierlist[key].forEach((deck: string) => {
      const entry = `[${deck}](${decklist[deck].url})\n`;
      if (message.length + entry.length >= 1024) {
        output.addField(
          (!cont ? key: `${key} cont.`), message, true
        );
        message = '';
        cont = true;
      }
      message += `[${deck}](${decklist[deck].url})\n`;
    });
    output.addField(
      (!cont ? key: `${key} cont.`), message, true
    );
  }

  output.addField("\u200B", "For additional decks use `!deck` or `!curated`", false)

  return output;
}

function getCurated() {
  let message = '';

  sortedlist["curated"].forEach((deck: string) => {
    message += `[${deck}](${decklist[deck].url})\n`;
  });

  if (message.length > 2000) message = message.slice(0, 1999);

  return (new RichEmbed()).addField("Curated Decks", message, true);
}

export {
  getTierlist as tierlist,
  getDecklist as decklist,
  getTiers as tier,
  getCurated as curated
};
