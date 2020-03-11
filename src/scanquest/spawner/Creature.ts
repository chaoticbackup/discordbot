import { RichEmbed } from 'discord.js';
import { API } from '../../database';
import { Creature } from '../../definitions';
import { ScannableCreature } from '../scanner/Creature';
import ScanFunction from './ScanFunction';

export default class ScanCreature extends ScanFunction {
  private readonly creatures: Creature[];

  constructor() {
    super();
    const creatures: Creature[] = API.find_cards_by_name('', ['type=creature']);
    this.creatures = creatures.filter((creature) =>
      creature.gsx$avatar && creature.gsx$avatar !== ''
    );
  }

  generate(): [ScannableCreature, RichEmbed] {
    const creature = this.randomCard(this.creatures) as Creature;
    const image = new RichEmbed()
    .setImage(API.base_image + creature.gsx$avatar);

    return [new ScannableCreature(creature), image];
  }
}
