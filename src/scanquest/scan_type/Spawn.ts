import { RichEmbed } from 'discord.js';
import { BaseCard, Card } from '../../definitions';
import Scannable from './Scannable';

export default abstract class Spawn {
  protected lastRandom = -1;

  /**
    Returns a random card from the list of given cards
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
    Returns a scannable card and an image to display
  */
  abstract generate(card?: Card): [Scannable, RichEmbed];

  abstract isSpawnable(card: Card): boolean;
}
