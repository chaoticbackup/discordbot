import { Client, Message, MessageReaction } from 'discord.js';

import { API } from '../../database';
import { SendFunction } from '../../definitions';

import card_db from './card_api';
import card_local from './card_local';
import found_card_list from './found_card_list';

export { default as full_art } from './full_art';
export { default as display_token } from './token';
export { default as avatar } from './avatar';

/*
  Returning a card
*/
export function display_card(name: string, options: string[], bot: Client) {
  /* If database hadn't been set up */
  if (API.data === 'local') {
    return card_local(name, bot);
  }
  else {
    return card_db(name, options, bot);
  }
}

const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

export async function find_card(name: string, bot: Client, send: SendFunction) {
  if (API.data === 'local') {
    return await send('Database offline; unable to find cards by name');
  }

  if (name.length < 2) {
    return await send('Use at least 2 characters');
  }

  const cards = API.find_card_name(name);

  if (cards.length === 0) {
    return await send('No cards match this search');
  }

  const text = found_card_list(name, cards);

  const response: Message = await send(text);

  for (let i = 0; i < cards.length && i < 9; i++) {
    await response.react(numbers[i]);
  }

  const filter = (reaction: MessageReaction) => {
    return numbers.includes(reaction.emoji.name);
  };

  return await response.awaitReactions(filter, { max: 1, time: 15000, errors: ['time'] })
  .then(async collected => {
    const reaction = collected.first();
    const index = numbers.indexOf(reaction.emoji.name);

    if (index >= 0) {
      const card = cards[index];
      const embed = display_card(card.gsx$name, [], bot);
      await send(embed);
    }

    await response.clearReactions();
  })
  .catch(async () => {
    await response.clearReactions();
  });
}
