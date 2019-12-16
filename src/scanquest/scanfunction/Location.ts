import { RichEmbed } from 'discord.js';
import { API } from '../../database';
import { Location } from '../../definitions';
import { ScannableLocation } from '../scannable/Location';
import ScanFunction from './ScanFunction';

export default class ScanLocation extends ScanFunction {
    private locations: Location[];

    constructor() {
        super();
        const locations: Location[] = API.find_cards_by_name("", ["type=location"]);
        this.locations = locations.filter((location) =>
            location.gsx$splash && location.gsx$splash !== ""
        );
    }

    generate(): [ScannableLocation, RichEmbed] {
        const location = this.randomCard(this.locations) as Location;
        const image = new RichEmbed()
            .setImage(API.base_image + location.gsx$splash);

        return [new ScannableLocation(location), image];
    }
} 
