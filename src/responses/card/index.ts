import { Client } from 'discord.js';
import { API } from '../../database';
import card_db from './card_api';
import card_local from './card_local';
import find from './find';

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

export function find_card(name: string) {
  if (API.data === 'local') {
    return 'Database offline; unable to find cards by name';
  }

  if (name.length < 2) {
    return 'Use at least 2 characters';
  }

  const resp = find(name);

  if (!resp) return 'No cards match this search';

  return resp;
}
