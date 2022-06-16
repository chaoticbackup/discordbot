import { cleantext } from '../../common';

import non from './config/nowornever.json';

export default function (name: string) {
  if (!name) {
    // Return random card
    const keys = Object.keys(non);
    return `${non[keys[keys.length * Math.random() << 0]]}`;
  }

  name = cleantext(name);
  for (const card in non) {
    if (cleantext(card).indexOf(name) === 0) {
      return `${non[card]}`;
    }
  }

  return 'Kazdan took your card';
}
