import { RichEmbed } from 'discord.js';
import { API } from '../../database';
import { Battlegear } from '../../definitions';
import { ScannableBattlegear } from '../scanner/Battlegear';
import ScanFunction from './ScanFunction';

export default class ScanBattlegear extends ScanFunction {
  private readonly battlegear: Battlegear[];

  constructor() {
    super();
    const battlegear = API.find_cards_by_name('', ['type=battlegear']) as Battlegear[];
    this.battlegear = battlegear.filter((b) =>
      API.hasFullart(b) && API.hasImage(b)
    );
  }

  generate(): [ScannableBattlegear, RichEmbed] {
    const battlegear = this.randomCard(this.battlegear) as Battlegear;
    const image = new RichEmbed()
    .setImage(API.cardFullart(battlegear))
    .setURL(API.cardFullart(battlegear));

    return [new ScannableBattlegear(battlegear), image];
  }
}
