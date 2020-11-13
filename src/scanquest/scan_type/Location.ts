import { RichEmbed } from 'discord.js';
import { Scanned } from './Scanned';
import { Scannable } from './Scannable';
import { Initiative } from '../../responses/card/card_api';
import Icons from '../../common/bot_icons';
import { API, color } from '../../database';
import { Location } from '../../definitions';
import { Spawn } from './Spawn';
import { ActiveScan } from '../database';

function isCard(arg: any): arg is Location {
  return (arg as Location)?.gsx$name !== undefined;
}

export class ScannedLocation extends Scanned {
  constructor(name: string) {
    super('Locations', name);
  }
}

export class ScannableLocation implements Scannable {
  card: ScannedLocation;

  constructor(location: Location | ScannedLocation) {
    if (isCard(location)) {
      this.card = new ScannedLocation(location.gsx$name);
    }
    else {
      this.card = new ScannedLocation(location.name);
    }
  }

  toString() {
    return this.card.name;
  }

  getCard(icons: Icons) {
    const card = API.find_cards_by_name(this.card.name)[0] as Location;

    const body = Initiative({ card, icons, options: [], textOnly: true });

    return new RichEmbed()
    .setTitle(this.card.name)
    .setColor(color(card))
    .setDescription(body)
    .setURL(API.cardImage(card))
    .setImage(API.cardImage(card));
  }
}

export class SpawnLocation extends Spawn {
  private readonly locations: Location[];

  constructor() {
    super();
    const locations = API.find_cards_by_name('', ['type=location']) as Location[];
    this.locations = locations.filter((l) =>
      API.hasFullart(l) && API.hasImage(l)
    );
  }

  generate(location: Location): [ScannableLocation, RichEmbed]
  generate(activescans: ActiveScan[], rarities?: string[]): [ScannableLocation, RichEmbed]
  generate(arg1: Location | ActiveScan[], arg2?: string[]): [ScannableLocation, RichEmbed] {
    let location: Location;

    if (isCard(arg1)) {
      location = arg1;
    } else {
      location = this.randomCard(this.locations, arg1, arg2) as Location;
    }

    const image = new RichEmbed()
    .setImage(API.cardFullart(location))
    .setURL(API.cardFullart(location));

    return [new ScannableLocation(location), image];
  }

  isSpawnable(card: Location) {
    return this.locations.filter((location) => location.gsx$name === card.gsx$name).length > 0;
  }
}
