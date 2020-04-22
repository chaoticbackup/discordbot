import { RichEmbed } from 'discord.js';
import Scan from './Scanned';
import Scannable from './Scannable';
import Icons from '../../common/bot_icons';
import { API, color } from '../../database';
import { Battlegear } from '../../definitions';

export class BattlegearScan extends Scan {
  constructor(name: string) {
    super('Battlegear', name);
  }
}

export class ScannableBattlegear implements Scannable {
  card: BattlegearScan;

  constructor(battlegear: Battlegear | BattlegearScan) {
    if ((battlegear as Battlegear).gsx$name !== undefined) {
      battlegear = (battlegear as Battlegear);
      this.card = new BattlegearScan(battlegear.gsx$name);
    }
    else {
      battlegear = (battlegear as BattlegearScan);
      this.card = new BattlegearScan(battlegear.name);
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
    .setURL(API.cardImage(card))
    .setImage(API.cardImage(card));
  }
}
