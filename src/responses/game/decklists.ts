import { RichEmbed } from 'discord.js';
import { cleantext } from '../../common';
import { parseTribe } from '../../common/card_types';
import { tierlist, decklist, axes, isTier, isType } from './config/decklists';

function _tiers(input: string) {
  input = input.toUpperCase();

  if (input === 'CM') input = 'S';

  if (isTier(input)) {
    let message = '';

    tierlist[input].forEach((deck: string) => {
      message += `${deck}: ${decklist[deck].url}\n`;
    });
    return (new RichEmbed()).addField(`${input} Decks`, message, true);
  }
}

function _types(input: string) {
  let type = input.charAt(0).toUpperCase() + input.slice(1);

  if (input.toLowerCase() === 'aggrocontrol') type = 'Aggro-Control';
  else if (input.toLowerCase() === 'controlaggro') type = 'Midrange';
  else if (input.toLowerCase() === 'antimeta' || input.toLowerCase() === 'meta') type = 'Anti-Meta';

  if (isType(type)) {
    let message = `**${type} Decks:**\n(${axes[type]})\n\u200B\n`;
    const typeList = [] as string[];

    for (const deck in decklist) {
      if (decklist[deck].type.includes(type)) typeList.push(deck);
    }

    typeList.forEach((deck: string) => {
      message += `${deck}: ${decklist[deck].url}\n`;
    });
    return (new RichEmbed()).setDescription(message);
  }

  return undefined;
}

function _tribes(input: string) {
  const tribe = (input === 'frozen') ? 'Mixed' : parseTribe(input, 'Mixed');

  if (tribe !== undefined) {
    let message = `**${tribe} Decks:**\n`;

    const tribelist = [] as string[];
    for (const deck in decklist) {
      if (!decklist[deck].tribe || tribe !== decklist[deck].tribe) continue;
      tribelist.push(deck);
    }

    tribelist.forEach((deck: string) => {
      message += `${deck}: ${decklist[deck].url}\n`;
    });
    return (new RichEmbed()).setDescription(message);
  }
}

function _tags(input: string) {
  const tagList = [] as string[];

  for (const deck in decklist) {
    const { tags } = decklist[deck];

    if (!tags) continue;
    tags.forEach(tag => {
      if (cleantext(tag).includes(input)) {
        tagList.push(`${deck}: ${decklist[deck].url}`);
      }
    });
  }

  if (tagList.length > 0) {
    let output = tagList.reduce((d1, d2) => `${d1}\n${d2}`);
    if (output.length > 2000) output = output.slice(0, 1999);
    return (new RichEmbed()).setDescription(output);
  }
}

function _axes() {
  let rsp = '';

  for (const [key, value] of Object.entries(axes)) {
    rsp += `**${key}**: ${value}\n`;
  }

  return rsp;
}

function _decklist(input: string): RichEmbed | string {
  let output: RichEmbed | undefined;
  input = cleantext(input);

  if (input.length < 1) {
    return 'Specify a tribe, tier, or keyword to search for decks';
  }

  if (input === 'types') {
    return _axes();
  }

  if (input.length <= 2 && (output = _tiers(input)) instanceof RichEmbed) {
    return output;
  }

  if ((output = _types(input)) instanceof RichEmbed) {
    return output;
  }

  if (input === 'generic' || input === 'tribeless') {
    return _tags('tribeless') as RichEmbed;
  }

  if ((output = _tribes(input)) instanceof RichEmbed) {
    return output;
  }

  if (input.length > 3 && (output = _tags(input)) instanceof RichEmbed) {
    return output;
  }

  return "I'm unable to find decks that match your search";
}

function _tierlist() {
  const output = new RichEmbed()
    // eslint-disable-next-line max-len
    .setDescription('Disclaimer: This tierlist does not always accurately reflect the meta but is rather a guide to what deck types are strong.');
  for (const key in tierlist) {
    let message = '';
    tierlist[key].forEach((deck: string) => {
      message += `${deck}: ${decklist[deck].url}\n`;
    });
    output.addField(key, message, true);
  }

  return output;
}

export {
  _tierlist as tierlist,
  _decklist as decklist
};
