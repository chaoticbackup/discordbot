import { RichEmbed } from 'discord.js';
import Scan from './Scan';
import Scannable from './Scannable';
import { Initiative } from '../../responses/card/card_api';
import Icons from '../../common/bot_icons';
import { API, color } from '../../database';
import { Location } from '../../definitions';

export class LocationScan extends Scan {
  constructor() {
    super('Locations');
  }
}

export class ScannableLocation implements Scannable {
  card: LocationScan;

  constructor(location: Location | LocationScan) {
    this.card = new LocationScan();
    if ((location as Location).gsx$name !== undefined) {
      location = (location as Location);
      this.card.name = location.gsx$name;
    }
    else {
      location = (location as LocationScan);
      this.card.name = location.name;
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
    .setURL(API.base_image + card.gsx$image)
    .setImage(API.base_image + card.gsx$image);
  }
}
