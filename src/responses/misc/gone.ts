import { Client, RichEmbed } from 'discord.js';
import { color } from '../../database';
import { cleantext, rndrsp } from '../../common';
import { Custom, Extra, Holiday, GoneChaotic, Gone2Chaotic, GoneChaotic3, Gone4Ever, Gone4_5, Gone_Chaotic_5 } from './config/gonechaotic.json';
import { parseType } from '../../common/card_types';
import { Card } from '../../definitions';

interface Gone {
  img: string
  type: string
  tribe?: string
  alt?: string
  text?: string
  flavor?: string
  stats?: number[]
}

const cardTypes = ['attack', 'creature', 'battlegear', 'mugic', 'location'];

// eslint-disable-next-line max-len
const merged: Record<string, Gone> = Object.assign({}, Custom, Extra, Holiday, GoneChaotic, Gone2Chaotic, GoneChaotic3, Gone4Ever, Gone4_5, Gone_Chaotic_5);

export default function (name: string, bot: Client, options: string[]) {
  const withStats = ([c, p, w, s, e]: number[]) => {
    return ''
    + `${c}${bot.emojis.find(emoji => emoji.name === 'Courage').toString()} `
    + `${p}${bot.emojis.find(emoji => emoji.name === 'Power').toString()} `
    + `${w}${bot.emojis.find(emoji => emoji.name === 'Wisdom').toString()} `
    + `${s}${bot.emojis.find(emoji => emoji.name === 'Speed').toString()} `
    + `| ${e} E`;
  };

  name = cleantext(name);
  let cardName: string;

  if (name) {
    let found = false;

    const keys = Object.keys(merged).sort((a, b) => a.localeCompare(b));
    for (const key of keys) {
      if (cleantext(key).indexOf(name) === 0) {
        cardName = key;
        found = true;
        break;
      }
    }

    if (!found) return rndrsp(
      ["Yokkis can't find your card", "I guess that card isn't *gone*"]
    );
  } else {
    const type = (/type=([\w]{2,})/).exec(options.join(' '));
    if (type?.[1] && cardTypes.includes(type[1].toLowerCase())) {
      do {
        cardName = rndrsp(Object.keys(merged));
      } while (!merged[cardName].type || merged[cardName].type.toLowerCase() !== type[1]);
    }
    else {
      cardName = rndrsp(Object.keys(merged), 'gone');
    }
  }

  const card = merged[cardName!];

  const re = new RichEmbed().setTitle(cardName!);

  if (options.includes('alt')) {
    if (card.alt) {
      re.setURL(card.alt).setImage(card.alt);
    }
    else {
      return `${cardName!} does not have alt art`;
    }
  }
  else {
    re.setURL(card.img).setImage(card.img);
  }

  let text = '';

  if (card.text) {
    text += card.text;
  }

  if (card.flavor) {
    text += `\n\n*${card.flavor}*`;
  }

  if (card.type === 'Creature' && card.stats) {
    text += `\n${withStats(card.stats)}`;
  }

  if (text !== '') {
    re.setDescription(text);
  }

  re.setColor(color({ gsx$type: parseType(card.type), gsx$tribe: card.tribe } as Card));

  return re;
}
