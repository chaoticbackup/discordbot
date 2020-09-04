import { RichEmbed } from 'discord.js';

import { Card, Battlegear, Creature, Location } from '../../definitions';
import { API } from '../../database';
import { Scannable } from '../scan_type/Scannable';
import { Server } from '../database';
import { SpawnBattlegear } from '../scan_type/Battlegear';
import { SpawnCreature } from '../scan_type/Creature';
import { SpawnLocation } from '../scan_type/Location';

export default class Select {
  private readonly scan_battlegear: SpawnBattlegear;
  private readonly scan_creature: SpawnCreature;
  private readonly scan_locations: SpawnLocation;

  constructor() {
    this.scan_battlegear = new SpawnBattlegear();
    this.scan_creature = new SpawnCreature();
    this.scan_locations = new SpawnLocation();
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

    image.setTitle(`Scan expires in ${active} hours`)
    .setDescription(`Get started by typing \`\`!scan\`\` in <#${server.receive_channel}>!`);

    return { scannable, image, active };
  }

  // Creatures spawn more often than locations and battlegear
  // TODO more complex spawn logic
  private select(server: Server): [Scannable, RichEmbed] {
    let scannable: Scannable;
    let image: RichEmbed;

    const rnd = Math.floor(Math.random() * 20);
    if (rnd < 4) {
      [scannable, image] = this.scan_locations.generate();
    }
    else if (rnd < 5) {
      [scannable, image] = this.scan_battlegear.generate();
    }
    else {
      [scannable, image] = this.scan_creature.generate();
    }

    // Don't resend existing scan
    if (server.activescans.find(scan => scan.scan.name === scannable.card.name)) {
      return this.select(server);
    }

    return [scannable, image];
  }

  public generate(card: Card): [Scannable, RichEmbed] | [] {
    switch (card.gsx$type) {
      case 'Attacks': return [];
      case 'Battlegear': return this.scan_battlegear.generate(card as Battlegear);
      case 'Creatures': return this.scan_creature.generate(card as Creature);
      case 'Locations': return this.scan_locations.generate(card as Location);
      case 'Mugic': return [];
      default: return [];
    }
  }

  public isSpawnable(card: Card) {
    switch (card.gsx$type) {
      case 'Attacks': return false;
      case 'Battlegear': return this.scan_battlegear.isSpawnable(card as Battlegear);
      case 'Creatures': return this.scan_creature.isSpawnable(card as Creature);
      case 'Locations': return this.scan_locations.isSpawnable(card as Location);
      case 'Mugic': return false;
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
        case 'Mugic': return 0;
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
