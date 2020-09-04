import { RichEmbed } from 'discord.js';
import { Scanned } from './Scanned';
import Icons from '../../common/bot_icons';

/**
 * @param card The scanned card characteristics
 */
export interface Scannable {
  card: Scanned

  toString(): string
  getCard(icons: Icons): RichEmbed
}
