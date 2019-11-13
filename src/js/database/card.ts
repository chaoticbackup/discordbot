import { Client } from 'discord.js';
import API from './database';
import card_local from './card_local';
import card_db from './card_api';

export {full_art} from './full_art';
export {find_card} from './find_card';

/*
  Returning a card
*/
export function display_card(name: string, options: string[], bot: Client) {
  /* If database hadn't been set up */
  if (API.data === "local") {
    return card_local(name, bot);
  }
  else {
    return card_db(name, options, bot);
  }
}