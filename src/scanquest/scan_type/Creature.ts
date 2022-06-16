import { RichEmbed } from 'discord.js';

import Icons from '../../common/bot_icons';
import { API, color } from '../../database';
import { Creature } from '../../definitions';

import { ActiveScan } from '../database';

import { Scannable } from './Scannable';
import { Scanned } from './Scanned';
import { Spawn } from './Spawn';

function isCard(arg: any): arg is Creature {
  return (arg as Creature)?.gsx$name !== undefined;
}

export class ScannedCreature extends Scanned {
  courage: number;
  power: number;
  wisdom: number;
  speed: number;
  energy: number;

  constructor(name: string, courage?: number, power?: number, wisdom?: number, speed?: number, energy?: number) {
    super('Creatures', name);
    if (courage !== undefined && power !== undefined && wisdom !== undefined && speed !== undefined && energy !== undefined) {
      this.courage = courage;
      this.power = power;
      this.wisdom = wisdom;
      this.speed = speed;
      this.energy = energy;
    }
  }
}

export class ScannableCreature implements Scannable {
  card: ScannedCreature;

  constructor(creature: Creature | ScannedCreature)
  {
    if (isCard(creature)) {
      this.card = new ScannedCreature(creature.gsx$name);
      if (creature.gsx$name === "Aa'une the Oligarch, Avatar") {
        this.card.courage = 200;
        this.card.power = 200;
        this.card.wisdom = 200;
        this.card.speed = 200;
        this.card.energy = 100;
      }
      else {
        this.card.courage = this.randomStat(creature.gsx$courage, 20);
        this.card.power = this.randomStat(creature.gsx$power, 20);
        this.card.wisdom = this.randomStat(creature.gsx$wisdom, 20);
        this.card.speed = this.randomStat(creature.gsx$speed, 20);
        this.card.energy = this.randomStat(creature.gsx$energy, 10);
      }
    }
    else {
      const { name, courage, power, wisdom, speed, energy } = creature;
      this.card = new ScannedCreature(name, courage, power, wisdom, speed, energy);
    }
  }

  private randomStat(stat: string | number, range: number): number {
    if (typeof stat === 'string') stat = parseInt(stat);
    const rnd = Math.floor(Math.random() * (range / 5 + 1));
    return (stat - (range / 2) + 5 * rnd);
  }

  toString() {
    return (
      `${this.card.name} ${
        this.card.courage.toString()} ${
        this.card.power.toString()} ${
        this.card.wisdom.toString()} ${
        this.card.speed.toString()} ${
        this.card.energy.toString()}`
    );
  }

  getCard(icons: Icons) {
    const { disciplines } = icons;
    const card = API.find_cards_by_name(this.card.name)[0] as Creature;

    const body = `${
      this.card.courage.toString()}${disciplines('Courage')} ${
      this.card.power.toString()}${disciplines('Power')} ${
      this.card.wisdom.toString()}${disciplines('Wisdom')} ${
      this.card.speed.toString()}${disciplines('Speed')} | ${
      this.card.energy.toString()}\u00A0E`;

    return new RichEmbed()
      .setTitle(this.card.name)
      .setColor(color(card))
      .setDescription(body)
      .setURL(API.cardImage(card))
      .setImage(API.cardImage(card));
  }
}

export class SpawnCreature extends Spawn {
  private readonly creatures: Creature[];

  constructor() {
    super();
    const creatures = API.find_cards_by_name('', ['type=creature']) as Creature[];
    this.creatures = creatures.filter(c => API.hasAvatar(c) && API.hasImage(c));
  }

  generate(card: Creature): [ScannableCreature, RichEmbed];
  generate(activescans: ActiveScan[], rarities?: string[]): [ScannableCreature, RichEmbed];
  generate(arg1: Creature | ActiveScan[], arg2?: string[]): [ScannableCreature, RichEmbed] {
    let creature: Creature;

    if (isCard(arg1)) {
      creature = arg1;
    } else {
      creature = this.randomCard(this.creatures, arg1, arg2) as Creature;
    }

    const image = new RichEmbed()
    .setImage(API.cardAvatar(creature))
    .setURL(API.cardAvatar(creature));

    return [new ScannableCreature(creature), image];
  }

  isSpawnable(card: Creature) {
    return this.creatures.filter((creature) => creature.gsx$name === card.gsx$name).length > 0;
  }
}
