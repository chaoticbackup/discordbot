import { RichEmbed } from 'discord.js';
import { cleantext } from '../../common';
import { parseTribe } from '../../common/card_types';

const tiers = ['S', 'A', 'B'] as const;

const tribes = ['OverWorld', 'UnderWorld', 'Danian', 'Mipedian', "M'arrillian", 'Mixed'] as const;

type Tier = typeof tiers[number];

type Tribe = typeof tribes[number];

interface Deck {
  url: string
  tribe: Tribe
  tags: string[]
}

interface decks {
  tierlist: Record<Tier, string[]>
  decklist: Record<string, Deck>
}

const { tierlist, decklist } = require('../config/decklists.json') as decks;

function _tierlist() {
  const output = new RichEmbed();
  for (const key in tierlist) {
    let message = '';
    tierlist[key as Tier].forEach((deck: string) => {
      message += `${deck}: ${decklist[deck].url}\n`;
    });
    return output.addField(key, message, true);
  }

  return output;
}

function _tiers(input: string) {
  input = input.toUpperCase();

  if (input === 'CM') input = 'S';
  if (input in tiers) {
    let message = '';
    tierlist[input as Tier].forEach((deck: string) => {
      message += `${deck}: ${decklist[deck].url}\n`;
    });
    return (new RichEmbed()).addField(`${input} Decks`, message, true);
  }
}

function _tribes(input: string) {
  let tribe = '' as string | undefined;
  if (input === 'mixed' || input === 'generic' || input === 'tribeless') {
    tribe = 'Mixed';
  }
  else {
    tribe = parseTribe(input);
  }

  if (tribe && tribes.includes(tribe as Tribe)) {
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
  const d = [] as string[];

  for (const deck in decklist) {
    const { tags } = decklist[deck];

    if (!tags) continue;
    tags.forEach(tag => {
      if (cleantext(tag).includes(input)) {
        d.push(`${deck}: ${decklist[deck].url}`);
      }
    });
  }

  if (d.length > 0) {
    const output = d.reduce((d1, d2) => `${d1}\n${d2}`);
    if (output.length < 2000)
      return (new RichEmbed()).setDescription(output);
  }
}

function _decklist(input: string): RichEmbed | string {
  let output;
  input = cleantext(input);

  if ((output = _tribes(input)) instanceof RichEmbed) {
    return output;
  }

  if ((output = _tiers(input)) instanceof RichEmbed) {
    return output;
  }

  if ((output = _tags(input)) instanceof RichEmbed) {
    return output;
  }

  return "I'm Unable to find decks that match your search";
}

export {
  _tierlist as tierlist,
  _decklist as decklist
};
