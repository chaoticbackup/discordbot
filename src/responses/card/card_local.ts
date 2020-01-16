import { Client, Emoji } from 'discord.js';
const cards = require('../config/cards.json');

function GenericCounter(cardtext: string, genCounter: Emoji) {
  if (genCounter) {
    return cardtext.replace(/:GenCounter:/gi, genCounter.toString());
  }
  return cardtext.replace(/:GenCounter:/gi, 'MC');
}

export default function(name: string, bot: Client) {
  const genCounter = bot.emojis.find(emoji => emoji.name === 'TLCounter');

  // Return random card
  if (!name) {
    const keys = Object.keys(cards);
    return `${GenericCounter(cards[keys[keys.length * Math.random() << 0]], genCounter)}`;
  }

  for (const key in cards) {
    if ((key).toLowerCase().indexOf(name) === 0) {
      return `${GenericCounter(cards[key], genCounter)}`;
    }
  }

  return "That's not a valid card name";
}
