import { RichEmbed } from 'discord.js';
import Scanned from './Scanned';
import Icons from '../../common/bot_icons';

/**
 * @param card The scanned card characteristics
 */
export default interface Scannable {
  card: Scanned

  toString(): string
  getCard(icons: Icons): RichEmbed
}
