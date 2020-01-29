import { RichEmbed } from 'discord.js';
import { BaseCard } from '../../definitions';
import { Scannable } from '../scannable/Scannable';

type Image = RichEmbed;

export default abstract class ScanFunction {
  protected lastRandom = -1;

  /**
     * Returns a random card from the list of given cards
     */
  protected randomCard(cards: BaseCard[]): any {
    let rnd;
    do {
      rnd = Math.floor(Math.random() * cards.length);
    } while (rnd === this.lastRandom);
    this.lastRandom = rnd;
    return cards[rnd];
  }

  /**
     * returns a scannable card and an image to display
     */
  abstract generate(): [Scannable, Image];
}
