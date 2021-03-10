import { RichEmbed } from 'discord.js';
import { API } from '../../database';
import missing from './config/recode_missing.json';

export function missing_cards() {
  const output = new RichEmbed()
  .setDescription('List of cards not currently in Chaotic Recode:');

  for (const type in missing) {
    let message = '';
    missing[type].forEach((card: string) => {
      message += `${card}\n`;
    });
    output.addField(type, message, true);
  }

  return output;
}

export function isMissing(name: string) {
  const results = API.find_cards_ignore_comma(name);

  if (results.length === 0) {
    return "That's not a valid card name";
  }

  const card = results[0];
  const { Attacks, Battlegear, Creatures, Locations, Mugic } = missing;
  const cards = ([] as string[]).concat(Attacks, Battlegear, Creatures, Locations, Mugic);

  if (cards.includes(card.gsx$name)) {
    return `${card.gsx$name} has not been added to recode`;
  }

  return `${card.gsx$name} should be in recode`;
}
