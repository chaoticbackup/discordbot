import { RichEmbed } from 'discord.js';
import { Scanned } from './Scanned';
import { Scannable } from './Scannable';
import Icons from '../../common/bot_icons';
import { API, color } from '../../database';
import { Battlegear } from '../../definitions';
import { Spawn } from './Spawn';
import { ActiveScan } from '../database';

function isCard(arg: any): arg is Battlegear {
  return (arg as Battlegear)?.gsx$name !== undefined;
}

export class ScannedBattlegear extends Scanned {
  constructor(name: string) {
    super('Battlegear', name);
  }
}

export class ScannableBattlegear implements Scannable {
  card: ScannedBattlegear;

  constructor(battlegear: Battlegear | ScannedBattlegear) {
    if (isCard(battlegear)) {
      this.card = new ScannedBattlegear(battlegear.gsx$name);
    }
    else {
      this.card = new ScannedBattlegear(battlegear.name);
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

export class SpawnBattlegear extends Spawn {
  private readonly battlegear: Battlegear[];

  constructor() {
    super();
    const battlegear = API.find_cards_by_name('', ['type=battlegear']) as Battlegear[];
    this.battlegear = battlegear.filter((b) =>
      API.hasFullart(b) && API.hasImage(b)
    );
  }

  generate(card: Battlegear): [ScannableBattlegear, RichEmbed]
  generate(activescans: ActiveScan[], rarities?: string[]): [ScannableBattlegear, RichEmbed]
  generate(arg1: Battlegear | ActiveScan[], arg2?: string[]): [ScannableBattlegear, RichEmbed] {
    let battlegear: Battlegear;
    if (isCard(arg1)) {
      battlegear = arg1;
    } else {
      battlegear = this.randomCard(this.battlegear, arg1, arg2) as Battlegear;
    }
    const image = new RichEmbed()
    .setImage(API.cardFullart(battlegear))
    .setURL(API.cardFullart(battlegear));

    return [new ScannableBattlegear(battlegear), image];
  }

  isSpawnable(card: Battlegear) {
    return this.battlegear.filter((battlegear) => battlegear.gsx$name === card.gsx$name).length > 0;
  }
}
