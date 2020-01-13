import { RichEmbed } from 'discord.js';
import Icons from '../../common/bot_icons';
import { API, color } from '../../database';
import { Battlegear } from '../../definitions';
import { Scan, Scannable } from './Scannable';

export class BattlegearScan extends Scan {

    constructor() {
        super("Battlegear");
    }
}

export class ScannableBattlegear implements Scannable {
    card: BattlegearScan;

    constructor(battlegear: Battlegear | BattlegearScan) {
        this.card = new BattlegearScan();
        if ((battlegear as Battlegear).gsx$name !== undefined) {
            battlegear = (battlegear as Battlegear);
            this.card.name = battlegear.gsx$name;
        }
        else {
            battlegear = (battlegear as BattlegearScan);
            this.card.name = battlegear.name;
        }
    }

    toString() {
        return this.card.name;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getCard(_icons: Icons) {
        const card = API.find_cards_by_name(this.card.name)[0] as Battlegear;

        return new RichEmbed()
            .setTitle(this.card.name)
            .setColor(color(card))
            // .setDescription(body)
            .setURL(API.base_image + card.gsx$image)
            .setImage(API.base_image + card.gsx$image);
    }
}
