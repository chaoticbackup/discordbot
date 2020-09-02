import { RichEmbed } from 'discord.js';
import { API } from '../../database';
import { Location } from '../../definitions';
import { ScannableLocation } from '../scanner/Location';
import ScanFunction from './ScanFunction';

export default class ScanLocation extends ScanFunction {
  private readonly locations: Location[];

  constructor() {
    super();
    const locations = API.find_cards_by_name('', ['type=location']) as Location[];
    this.locations = locations.filter((l) =>
      API.hasFullart(l) && API.hasImage(l)
    );
  }

  generate(): [ScannableLocation, RichEmbed] {
    const location = this.randomCard(this.locations) as Location;
    const image = new RichEmbed()
    .setImage(API.cardFullart(location))
    .setURL(API.cardFullart(location));

    return [new ScannableLocation(location), image];
  }
}
