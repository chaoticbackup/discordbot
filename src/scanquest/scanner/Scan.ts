import { CardType } from '../../definitions';
import { Code } from './Code';

/**
 * @param name The name of the card
 * @param image The image that is spawned
 * @param code The unique code of the card
*/
export default class Scan {
  name: string;
  type: CardType;
  code: Code;

  constructor(type: CardType) {
    this.type = type;
  }
}
