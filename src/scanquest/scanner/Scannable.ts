import { RichEmbed } from 'discord.js';
import Scan from './Scan';
import Icons from '../../common/bot_icons';

/**
 * @param card The scanned card characteristics
 */
export default interface Scannable {
  card: Scan

  toString(): string
  getCard(icons?: Icons): RichEmbed
}
