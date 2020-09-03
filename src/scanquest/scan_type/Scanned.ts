import { CardType, Code } from '../../definitions';

/**
 * @param name The name of the card
 * @param type The type of card it is
 * @param code The unique code of the card
*/
export default class Scanned {
  name: string;
  type: CardType;
  code?: Code;

  constructor(type: CardType, name: string) {
    this.name = name;
    this.type = type;
  }
}
