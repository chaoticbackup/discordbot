import { cleantext } from '../../common';
const non = require('../config/nowornever.json');

export default function (name: string) {
  if (!name) {
    // Return random card
    const keys = Object.keys(non);
    return `${non[keys[keys.length * Math.random() << 0]]}`;
  }

  name = cleantext(name);
  for (var card in non) {
    if (cleantext(card).indexOf(name) === 0) {
      return `${non[card]}`;
    }
  }
}
