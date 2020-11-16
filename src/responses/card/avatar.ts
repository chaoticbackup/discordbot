import { RichEmbed } from 'discord.js';
import { API, color } from '../../database';
import { Creature } from '../../definitions';
import { rndrsp } from '../../common';

export default function (name: string) {
  const results = API.find_cards_ignore_comma(name, ['type=creature']) as Creature[];
  let card: Creature;

  if (!name) {
    do {
      card = rndrsp(results);
    } while (!API.hasAvatar(card));
  }
  else if (results.length > 0) {
    card = results[0];
    if (!API.hasAvatar(card)) {
      return `Sorry, I don't have ${card.gsx$name}'s avatar`;
    }
  }
  else {
    return "That's not a valid card name";
  }

  return new RichEmbed()
  .setColor(color(card))
  .setTitle(card.gsx$name)
  .setURL(API.cardAvatar(card))
  .setImage(API.cardAvatar(card));
}
