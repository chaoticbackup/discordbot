import { Client, RichEmbed } from 'discord.js';
import { cleantext, rndrsp } from '../../common';
const { Custom, Extra, GoneChaotic, Gone2Chaotic, GoneChaotic3, Gone4Ever } = require('../config/gonechaotic.json');

interface temp {
  img: string
  type?: string
  alt?: string
}

const cardTypes = ['attack', 'creature', 'battlegear', 'mugic', 'location'];

export default function (name: string, bot: Client, options: string[]) {
  const merged: Record<string, temp> = Object.assign({}, Custom, Extra, GoneChaotic, Gone2Chaotic, GoneChaotic3, Gone4Ever);

  const withStats = (c: number, p: number, w: number, s: number, e: number) => {
    return ''
    + `${c}${bot.emojis.find(emoji => emoji.name === 'Courage').toString()} `
    + `${p}${bot.emojis.find(emoji => emoji.name === 'Power').toString()} `
    + `${w}${bot.emojis.find(emoji => emoji.name === 'Wisdom').toString()} `
    + `${s}${bot.emojis.find(emoji => emoji.name === 'Speed').toString()} `
    + `| ${e} E`;
  }

  name = cleantext(name);
  let card: string | undefined;

  if (name) {
    let found = false;

    for (var key in merged) {
      if (cleantext(key).indexOf(name) === 0) {
        card = key;
        found = true;
        break;
      }
    }

    if (!found) return rndrsp(
      ["Yokkis can't find your card", "I guess that card isn't *gone*"]
    );
  }

  if (card === undefined) {
    const type = (/type=([\w]{2,})/).exec(options.join(' '));
    if (type?.[1] && cardTypes.includes(type[1])) {
      do {
        card = rndrsp(Object.keys(merged));
      } while (!merged[card].type || merged[card].type?.toLowerCase() !== type[1]);
    }
    else if (card === undefined) {
      card = rndrsp(Object.keys(merged), 'gone');
    }
  }

  const re = new RichEmbed().setTitle(card);

  if (options.includes('alt')) {
    if (merged[card].alt) {
      re.setURL(merged[card].alt as string).setImage(merged[card].alt as string);
    }
    else {
      return `${card} does not have alt art`;
    }
  }
  else {
    re.setURL(merged[card].img).setImage(merged[card].img);
  }

  if (card === 'Nakan') {
    return re.setDescription(withStats(88, 76, 23, 41, 59))
  }
  else if (card === 'Proboscar (Powerful)') {
    return re.setDescription(withStats(60, 90, 25, 85, 65))
  }

  return re;
}
