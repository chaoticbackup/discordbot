import { RichEmbed } from 'discord.js';

import Icons from '../../common/bot_icons';

import { Scanned } from './Scanned';

/**
 * @param card The scanned card characteristics
 */
export interface Scannable {
  card: Scanned

  toString(): string
  getCard(icons: Icons): RichEmbed
}
