import { RichEmbed } from 'discord.js';
import { API } from '../../database';
import { Creature } from '../../definitions';
import { ScannableCreature } from '../scanner/Creature';
import ScanFunction from './ScanFunction';

export default class ScanCreature extends ScanFunction {
  private readonly creatures: Creature[];

  constructor() {
    super();
    const creatures = API.find_cards_by_name('', ['type=creature']) as Creature[];
    this.creatures = creatures.filter(c => API.hasAvatar(c) && API.hasImage(c));
  }

  generate(): [ScannableCreature, RichEmbed] {
    const creature = this.randomCard(this.creatures) as Creature;
    const image = new RichEmbed()
    .setImage(API.cardAvatar(creature))
    .setURL(API.cardAvatar(creature));

    return [new ScannableCreature(creature), image];
  }
}
