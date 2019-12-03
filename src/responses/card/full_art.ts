import { RichEmbed } from 'discord.js';
import { API, color } from '../../database';

export default function (name: string) {
  let results = API.find_cards_by_name(name);

  if (results.length > 0) {
    let card = results[0];
    if (card.gsx$splash) return new RichEmbed()
      .setColor(color(card))
      .setTitle(card.gsx$name)
      .setURL(API.base_image + card.gsx$splash)
      .setImage(API.base_image + card.gsx$splash);
    else {
      return `Sorry, I don't have ${card.gsx$name}'s full art`;
    }
  }
  else {
    return "That's not a valid card name";
  }
}
