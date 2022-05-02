import { RichEmbed } from 'discord.js';

import Icons from '../../common/bot_icons';
import { API, color } from '../../database';
import { Mugic } from '../../definitions';

import { ActiveScan } from '../database';

import { Scannable } from './Scannable';
import { Scanned } from './Scanned';
import { Spawn } from './Spawn';

function isCard(arg: any): arg is Mugic {
  return (arg as Mugic)?.gsx$name !== undefined;
}

export class ScannedMugic extends Scanned {
  constructor(name: string) {
    super('Mugic', name);
  }
}

export class ScannableMugic implements Scannable {
  card: ScannedMugic;

  constructor(mugic: Mugic | ScannedMugic) {
    if (isCard(mugic)) {
      this.card = new ScannedMugic(mugic.gsx$name);
    }
    else {
      this.card = new ScannedMugic(mugic.name);
    }
  }

  toString() {
    return this.card.name;
  }

  getCard(_icons: Icons) {
    const card = API.find_cards_by_name(this.card.name)[0] as Mugic;

    return new RichEmbed()
      .setTitle(this.card.name)
      .setColor(color(card))
      // .setDescription(body)
      .setURL(API.cardImage(card))
      .setImage(API.cardImage(card));
  }
}

export class SpawnMugic extends Spawn {
  private readonly mugic: Mugic[];

  constructor() {
    super();

    const mugic = API.find_cards_by_name('', ['type=mugic']) as Mugic[];
    this.mugic = mugic.filter(m =>
      API.hasFullart(m) && API.hasImage(m)
    );
  }

  generate(card: Mugic): [ScannableMugic, RichEmbed];
  generate(activescans: ActiveScan[], rarities?: string[]): [ScannableMugic, RichEmbed];
  generate(arg1: Mugic | ActiveScan[], arg2?: string[]): [ScannableMugic, RichEmbed] {
    let mugic: Mugic;
    if (isCard(arg1)) {
      mugic = arg1;
    } else {
      mugic = this.randomCard(this.mugic, arg1, arg2) as Mugic;
    }
    const url = API.cardFullart(mugic);
    const image = new RichEmbed().setImage(url).setURL(url);

    return [new ScannableMugic(mugic), image];
  }

  isSpawnable(card: Mugic) {
    return this.mugic.filter(mugic => mugic.gsx$name === card.gsx$name).length > 0;
  }
}
