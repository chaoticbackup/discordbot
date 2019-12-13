import {CardType} from '../../definitions';
import { RichEmbed } from 'discord.js';
import Icons from '../../common/bot_icons';

/**
 * @param name The name of the card
 * @param image The image that is spawned
*/
export class Scan {
    name: string;
    type: CardType;

    constructor(type: CardType) {
        this.type = type;
    }
}

/**
 * @param card The scanned card characteristics
 */
export interface Scannable {
    card: Scan;

    toString(): string;
    getCard(icons?: Icons): RichEmbed;
}

