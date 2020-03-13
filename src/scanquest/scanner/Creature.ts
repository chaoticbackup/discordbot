import { RichEmbed } from 'discord.js';
import Scan from './Scanned';
import Scannable from './Scannable';
import Icons from '../../common/bot_icons';
import { API, color } from '../../database';
import { Creature } from '../../definitions';

export class CreatureScan extends Scan {
  courage: number;
  power: number;
  wisdom: number;
  speed: number;
  energy: number;

  constructor() {
    super('Creatures');
  }
}

export class ScannableCreature implements Scannable {
  card: CreatureScan;

  constructor(creature: Creature | CreatureScan)
  {
    this.card = new CreatureScan();
    if ((creature as Creature).gsx$name !== undefined) {
      creature = (creature as Creature);
      if (creature.gsx$name === "Aa'une the Oligarch, Avatar") {
        this.card.name = creature.gsx$name;
        this.card.courage = 200;
        this.card.power = 200;
        this.card.wisdom = 200;
        this.card.speed = 200;
        this.card.energy = 100;
      }
      else {
        this.card.name = creature.gsx$name;
        this.card.courage = this.randomStat(creature.gsx$courage, 20);
        this.card.power = this.randomStat(creature.gsx$power, 20);
        this.card.wisdom = this.randomStat(creature.gsx$wisdom, 20);
        this.card.speed = this.randomStat(creature.gsx$speed, 20);
        this.card.energy = this.randomStat(creature.gsx$energy, 10);
      }
    }
    else {
      creature = (creature as CreatureScan);
      this.card.name = creature.name;
      this.card.courage = creature.courage;
      this.card.power = creature.power;
      this.card.wisdom = creature.wisdom;
      this.card.speed = creature.speed;
      this.card.energy = creature.energy;
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
    .setURL(API.base_image + card.gsx$image)
    .setImage(API.base_image + card.gsx$image);
  }
}
