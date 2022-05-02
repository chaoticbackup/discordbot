import { rndrsp } from '../../common';

import jokes from './config/jokes.json';

export default function (input: string = '') {
  if (input.length >= 3) {
    for (const joke of jokes) {
      if (joke.toLowerCase().includes(input)) {
        return joke;
      }
    }
  }

  return rndrsp(jokes, 'joke');
}
