import { RichEmbed } from 'discord.js';
import Scan from './Scanned';
import Scannable from './Scannable';
import Icons from '../../common/bot_icons';
import { API, color } from '../../database';
import { Battlegear } from '../../definitions';

export class BattlegearScan extends Scan {
  constructor() {
    super('Battlegear');
  }
}

export class ScannableBattlegear implements Scannable {
  card: BattlegearScan;

  constructor(battlegear: Battlegear | BattlegearScan) {
    this.card = new BattlegearScan();
    if ((battlegear as Battlegear).gsx$name !== undefined) {
      battlegear = (battlegear as Battlegear);
      this.card.name = battlegear.gsx$name;
    }
    else {
      battlegear = (battlegear as BattlegearScan);
      this.card.name = battlegear.name;
    }
  }

  toString() {
    return this.card.name;
  }

  getCard(_icons: Icons) {
    const card = API.find_cards_by_name(this.card.name)[0] as Battlegear;

    return new RichEmbed()
    .setTitle(this.card.name)
    .setColor(color(card))
    // .setDescription(body)
    .setURL(API.base_image + card.gsx$image)
    .setImage(API.base_image + card.gsx$image);
  }
}
