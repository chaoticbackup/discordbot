import { RichEmbed } from 'discord.js';
import moment from 'moment';

import { API } from '../../database';
import { Card, CardType } from '../../definitions';
import ScanQuestDB, { Server, ActiveScan } from '../database';
import { SpawnBattlegear } from '../scan_type/Battlegear';
import { SpawnCreature } from '../scan_type/Creature';
import { SpawnLocation } from '../scan_type/Location';
import { SpawnMugic } from '../scan_type/Mugic';
import { Scannable } from '../scan_type/Scannable';

/**
 * @property {Scannable} scannable
 * @property {RichEmbed} image - Rich Embed
 * @property {number} active - Hours active
 * @property {number} next - The maximum time until the next spawn
 */
export interface Selection {
  scannable: Scannable
  image: RichEmbed
  active: number
  next: number
}

const rarity_map: { [key: string]: number } = {
  promo: 1.5,
  'ultra rare': 1,
  'super rare': 1.5,
  rare: 2,
  uncommon: 2.5,
  common: 2.5
};

const type_map: { [key in CardType]: number } = {
  Attacks: 0,
  Battlegear: 2,
  Creatures: 1,
  Locations: 2,
  Mugic: 2.5
};

export default class Select {
  private readonly scan_battlegear: SpawnBattlegear;
  private readonly scan_creature: SpawnCreature;
  private readonly scan_locations: SpawnLocation;
  private readonly scan_mugic: SpawnMugic;

  readonly db: ScanQuestDB;

  constructor(db: ScanQuestDB) {
    this.db = db;
    this.scan_battlegear = new SpawnBattlegear();
    this.scan_creature = new SpawnCreature();
    this.scan_locations = new SpawnLocation();
    this.scan_mugic = new SpawnMugic();
  }

  public setTitle(image: RichEmbed, active: number) {
    let title = '';
    if (Number(active.toFixed(2)) > 0) {
      if (active >= 1) title = `Scan expires <t:${moment().add(active, 'hours').unix()}:R>`;
      else title = `Scan expires <t:${moment().add(Number(active.toFixed(2)) * 60, 'minutes').unix()}:R>`;
    }
    else title = 'Scan expired';
    image.setTitle(title);
  }

  /**
   * Picks a new card and duration to send
   * @param server The server that we're picking a card for
   */
  public async card(server: Server, amount: number): Promise<Selection>;
  public async card(server: Server, scannable?: Scannable, image?: RichEmbed): Promise<Selection>;
  public async card(server: Server, arg1?: Scannable | number, arg2?: RichEmbed): Promise<Selection> {
    let scannable;
    let image;

    if (arg1 === undefined || typeof arg1 === 'number' || arg2 === undefined) {
      const amount = (typeof arg1 === 'number') ? arg1 : 0;
      const activescans = await this.db.getActiveScans(server);
      [scannable, image] = this.select(activescans, amount);
    } else {
      scannable = arg1;
      image = arg2;
    }

    const card = API.find_cards_by_name(scannable.card.name)[0];

    const t = card.gsx$type;
    const type = (t in type_map) ? type_map[t] : 0;

    const r = card.gsx$rarity.toLowerCase();
    const rarity = (r in rarity_map) ? rarity_map[r] : 0;

    let next = 0;
    let active = 0;

    if (rarity > 0 && type > 0) {
      active = 12 * (type + rarity);
      next = Math.max(4, (9 - rarity * 2));
    }

    this.setTitle(image, active);
    image.setDescription(`Get started by typing \`\`!scan\`\` in <#${server.receive_channel}>!`);

    return { scannable, image, active, next };
  }

  // Creatures spawn more often than locations and battlegear
  private select(activescans: ActiveScan[], amount: number): [Scannable, RichEmbed] {
    let scannable: Scannable;
    let image: RichEmbed;

    const rnd = Math.floor(Math.random() * 25);
    // 4%
    if (rnd < 1) {
      const rarities = this.filterRarities('Mugic', amount);
      [scannable, image] = this.scan_mugic.generate(activescans, rarities);
    }
    // 16%
    else if (rnd < 5) {
      const rarities = this.filterRarities('Locations', amount);
      [scannable, image] = this.scan_locations.generate(activescans, rarities);
    }
    // 20 %
    else if (rnd < 10) {
      const rarities = this.filterRarities('Battlegear', amount);
      [scannable, image] = this.scan_battlegear.generate(activescans, rarities);
    }
    // 60%
    else {
      const rarities = this.filterRarities('Creatures', amount);
      [scannable, image] = this.scan_creature.generate(activescans, rarities);
    }

    return [scannable, image];
  }

  private filterRarities(type: CardType, amount: number): string[] {
    // TODO calculate using amount for threshold from amount
    const condition = 0;

    return Object.entries(rarity_map)
      .filter(([_r, v]) => {
        return (v * type_map[type]) >= condition;
      })
      .map(([r, _v]) => r);
  }

  public generateFromCard(card: Card): [Scannable, RichEmbed] | [] {
    if (!this.isSpawnable(card)) return [];
    switch (card.gsx$type) {
      case 'Attacks': return [];
      case 'Battlegear': return this.scan_battlegear.generate(card);
      case 'Creatures': return this.scan_creature.generate(card);
      case 'Locations': return this.scan_locations.generate(card);
      case 'Mugic': return this.scan_mugic.generate(card);
      default: return [];
    }
  }

  public generateFromType(type: CardType, activescans: ActiveScan[]) {
    switch (type) {
      case 'Attacks': return [];
      case 'Battlegear': return this.scan_battlegear.generate(activescans);
      case 'Creatures': return this.scan_creature.generate(activescans);
      case 'Locations': return this.scan_locations.generate(activescans);
      case 'Mugic': return this.scan_mugic.generate(activescans);
    }
  }

  public isSpawnable(card: Card) {
    switch (card.gsx$type) {
      case 'Attacks': return false;
      case 'Battlegear': return this.scan_battlegear.isSpawnable(card);
      case 'Creatures': return this.scan_creature.isSpawnable(card);
      case 'Locations': return this.scan_locations.isSpawnable(card);
      case 'Mugic': return this.scan_mugic.isSpawnable(card);
      default: return false;
    }
  }
}
