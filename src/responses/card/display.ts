import { Client } from 'discord.js';
import { API } from '../../database';
import card_db from './card_api';
import card_local from './card_local';

/*
  Returning a card
*/
export default function (name: string, options: string[], bot: Client) {
  /* If database hadn't been set up */
  if (API.data === "local") {
    return card_local(name, bot);
  }
  else {
    return card_db(name, options, bot);
  }
}
