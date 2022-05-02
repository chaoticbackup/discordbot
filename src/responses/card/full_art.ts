import { RichEmbed } from 'discord.js';

import { rndrsp } from '../../common';
import { API, color } from '../../database';
import { Card } from '../../definitions';

export default function (name: string, options: string[]) {
  if (API.data === 'local') {
    return 'Database offline; unable to find cards by name';
  }

  const results = API.find_cards_ignore_comma(name);
  let card: Card;

  if (!name) {
    while (!API.hasFullart(card = rndrsp(results)));
  }
  else if (results.length > 0) {
    card = results[0];
    if (!API.hasFullart(card)) {
      return `Sorry, I don't have ${card.gsx$name}'s full art`;
    }
  }
  else {
    return "That's not a valid card name";
  }

  const url = API.cardFullart(card, options);

  const embed = new RichEmbed()
  .setColor(color(card))
  .setTitle(card.gsx$name)
  .setURL(url)
  .setImage(url);

  if (!options.includes('alt') && card.gsx$alt) {
    if (!options.includes('alt2')) {
      if (card.gsx$alt2) {
        embed.setDescription(`${card.gsx$name} has 2 alt arts`);
      }
      else {
        embed.setDescription(`${card.gsx$name} has 1 alt art`);
      }
    }
  }

  return embed;
}
