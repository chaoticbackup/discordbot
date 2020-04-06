import { CardType } from '../../definitions';
import { Code } from '../definitions';

/**
 * @param name The name of the card
 * @param image The image that is spawned
 * @param code The unique code of the card
*/
export default class Scanned {
  name: string;
  type: CardType;
  code: Code;

  constructor(type: CardType) {
    this.type = type;
  }
}
