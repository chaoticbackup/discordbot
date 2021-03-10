import { RichEmbed } from 'discord.js';
import cards from './config/recode_missing.json';

export function missing_cards() {
  const output = new RichEmbed()
  .setDescription('List of cards not currently in Chaotic Recode:');

  for (const type in cards) {
    let message = '';
    cards[type].forEach((card: string) => {
      message += `${card}\n`;
    });
    output.addField(type, message, true);
  }

  return output;
}
