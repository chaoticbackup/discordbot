import { RichEmbed } from 'discord.js';

import { Card, Battlegear, Creature, Location, Mugic, CardType } from '../../definitions';
import { API } from '../../database';
import { Scannable } from '../scan_type/Scannable';
import { Server, ActiveScan } from '../database';
import { SpawnBattlegear } from '../scan_type/Battlegear';
import { SpawnCreature } from '../scan_type/Creature';
import { SpawnLocation } from '../scan_type/Location';
import { SpawnMugic } from '../scan_type/Mugic';

export default class Select {
  private readonly scan_battlegear: SpawnBattlegear;
  private readonly scan_creature: SpawnCreature;
  private readonly scan_locations: SpawnLocation;
  private readonly scan_mugic: SpawnMugic;

  constructor() {
    this.scan_battlegear = new SpawnBattlegear();
    this.scan_creature = new SpawnCreature();
    this.scan_locations = new SpawnLocation();
    this.scan_mugic = new SpawnMugic();
  }

  public setTitle(image: RichEmbed, active: number) {
    let title = '';

    if (active > 1) title = `Scan expires in ${active} hours`;
    else if (Number(active.toFixed(2)) > 0) title = `Scan expires in ${active * 60} minutes`;
    else title = 'Scan expired';
    image.setTitle(title);
  }

  /**
   * Picks a new card and duration to send
   * @param server The server that we're picking a card for
   */
  public card(server: Server, scannable?: Scannable, image?: RichEmbed) {
    if (scannable === undefined || image === undefined) {
      [scannable, image] = this.select(server);
    }

    const active = this.duration(API.find_cards_by_name(scannable.card.name)[0]);

    this.setTitle(image, active);
    image.setDescription(`Get started by typing \`\`!scan\`\` in <#${server.receive_channel}>!`);

    return { scannable, image, active };
  }

  // Creatures spawn more often than locations and battlegear
  // TODO more complex spawn logic
  private select(server: Server): [Scannable, RichEmbed] {
    let scannable: Scannable;
    let image: RichEmbed;

    const rnd = Math.floor(Math.random() * 25);
    // 4%
    if (rnd < 1) {
      [scannable, image] = this.scan_mugic.generate(server.activescans);
    }
    // 16%
    else if (rnd < 5) {
      [scannable, image] = this.scan_locations.generate(server.activescans);
    }
    // 20 %
    else if (rnd < 10) {
      [scannable, image] = this.scan_battlegear.generate(server.activescans);
    }
    // 60%
    else {
      [scannable, image] = this.scan_creature.generate(server.activescans);
    }

    return [scannable, image];
  }

  public generateFromCard(card: Card): [Scannable, RichEmbed] | [] {
    if (!this.isSpawnable(card)) return [];
    switch (card.gsx$type) {
      case 'Attacks': return [];
      case 'Battlegear': return this.scan_battlegear.generate(card as Battlegear);
      case 'Creatures': return this.scan_creature.generate(card as Creature);
      case 'Locations': return this.scan_locations.generate(card as Location);
      case 'Mugic': return this.scan_mugic.generate(card as Mugic);
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
      case 'Battlegear': return this.scan_battlegear.isSpawnable(card as Battlegear);
      case 'Creatures': return this.scan_creature.isSpawnable(card as Creature);
      case 'Locations': return this.scan_locations.isSpawnable(card as Location);
      case 'Mugic': return this.scan_mugic.isSpawnable(card as Mugic);
      default: return false;
    }
  }

  public duration(card: Card) {
    const type = (() => {
      switch (card.gsx$type) {
        case 'Attacks': return 0;
        case 'Battlegear': return 3;
        case 'Creatures': return 2;
        case 'Locations': return 4;
        case 'Mugic': return 4;
        default: return 0;
      }
    })();

    const rarity = (() => {
      switch (card.gsx$rarity.toLowerCase()) {
        case 'promo': return 4;
        case 'ultra rare': return 4.5;
        case 'super rare': return 4;
        case 'rare': return 3;
        case 'uncommon': return 2;
        case 'common': return 2;
        default: return 2;
      }
    })();

    return type * rarity;
  }
}
