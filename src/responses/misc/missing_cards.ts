import { RichEmbed } from 'discord.js';

import { API } from '../../database';

import missing from './config/recode_missing.json';

export function missing_cards() {
  const output = new RichEmbed()
  .setDescription(
    '[List of cards not currently in Chaotic Recode:](https://docs.google.com/document/d/1S6uUguWyn6zjtz-Ai_iWugzzEA_MaCWZUbFYw3yCGCM)'
  );

  for (const type in missing) {
    let message = '';
    missing[type].forEach((card: string) => {
      message += `${card}\n`;
    });
    output.addField(type, message, true);
  }

  return output;
}

const { Attacks, Battlegear, Creatures, Locations, Mugic } = missing;
const cards = ([] as string[]).concat(Attacks, Battlegear, Creatures, Locations, Mugic);

const mined = ['Mondo Rondo'];

export function isMissing(name: string) {
  const results = API.find_cards_ignore_comma(name);

  if (results.length === 0) {
    return "That's not a valid card name";
  }

  const card = results[0];

  if (mined.includes(card.gsx$name)) {
    return `${card.gsx$name} won't be added to recode. Gerb doesn't recognize it as a legally playable card.`;
  }

  if (cards.includes(card.gsx$name)) {
    return `${card.gsx$name} has not been added to recode`;
  }

  return `${card.gsx$name} should be in recode`;
}
