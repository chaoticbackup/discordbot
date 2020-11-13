import { RichEmbed } from 'discord.js';
import { Card } from '../../definitions';
import { Scannable } from './Scannable';
import { ActiveScan } from '../database';

export abstract class Spawn {
  /**
    Returns a random card from the list of given cards
  */
  protected randomCard(cards: Card[], activescans: ActiveScan[], rarities?: string[]): Card {
    const scans = cards.slice();
    let rnd: number, card: Card;

    do {
      rnd = Math.floor(Math.random() * scans.length);
      card = scans[rnd];
      // Don't resend existing scan
      if (activescans.find(scan => scan.scan.name === card.gsx$name) === undefined) {
        // If a list of rarities is provided, only include a card of that rarity
        if (rarities && rarities.length > 0) {
          if (rarities.includes(card.gsx$rarity.toLowerCase())) {
            return card;
          }
        } else {
          return card;
        }
      }
      scans.splice(rnd, 1);
    } while (scans.length > 0);

    // If somehow all scans are exhausted, send any random one
    rnd = Math.floor(Math.random() * cards.length);
    return cards[rnd];
  }

  /**
    Returns a scannable card and an image to display.
    If a card is not provided, selects a random scannable card that isn't already active
  */
  abstract generate(arg1: Card | ActiveScan[], rarities?: string[]): [Scannable, RichEmbed];

  abstract isSpawnable(card: Card): boolean;
}
