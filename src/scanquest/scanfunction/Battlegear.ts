import { RichEmbed } from 'discord.js';
import { API } from '../../database';
import { Battlegear } from '../../definitions';
import { ScannableBattlegear } from '../scannable/Battlegear';
import ScanFunction from './ScanFunction';

export default class ScanBattlegear extends ScanFunction {
    private battlegear: Battlegear[];

    constructor() {
        super();
        const battlegear: Battlegear[] = API.find_cards_by_name("", ["type=battlegear"]);
        this.battlegear = battlegear.filter((battlegear) =>
            battlegear.gsx$splash && battlegear.gsx$splash !== "" &&
            battlegear.gsx$image && battlegear.gsx$image !== ""
        );
    }

    generate(): [ScannableBattlegear, RichEmbed] {
        const battlegear = this.randomCard(this.battlegear) as Battlegear;
        const image = new RichEmbed()
            .setImage(API.base_image + battlegear.gsx$splash);

        return [new ScannableBattlegear(battlegear), image];
    }
} 
