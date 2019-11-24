import { RichEmbed } from 'discord.js';
import color from './card_color';
import API from './database';

export function full_art(name: string) {
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