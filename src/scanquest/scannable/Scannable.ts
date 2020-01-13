import {CardType} from '../../definitions';
import { RichEmbed } from 'discord.js';
import Icons from '../../common/bot_icons';
import {Code} from '../scan_db/code';

/**
 * @param name The name of the card
 * @param type The type of card
*/
export class Scan {
    name: string;
    type: CardType;
    code: Code;

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

