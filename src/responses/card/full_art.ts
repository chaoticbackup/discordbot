import { RichEmbed } from 'discord.js';
import { API, color } from '../../database';
import { Card } from '../../definitions';

export default function (name: string, options: string[]) {
  const results = API.find_cards_by_name(name);

  if (results.length > 0) {
    const card = results[0] as Card;
    if (card.gsx$splash) {
      let url = API.base_image + card.gsx$splash;

      if (options.includes('alt')) {
        if (card.gsx$alt) {
          url = API.base_image + card.gsx$alt;
        }
      }

      return new RichEmbed()
        .setColor(color(card))
        .setTitle(card.gsx$name)
        .setURL(url)
        .setImage(url);
    }
    else {
      return `Sorry, I don't have ${card.gsx$name}'s full art`;
    }
  }
  else {
    return "That's not a valid card name";
  }
}
