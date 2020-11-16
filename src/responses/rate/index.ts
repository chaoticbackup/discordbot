import { API } from '../../database';
import { devType } from '../../bot';
import { Client } from 'discord.js';
import { isCreature } from '../../definitions';
import { king } from './king';
import { metal } from './metal';
import { smildon } from './smildon';
import Icons from '../../common/bot_icons';

export default function (text: string, options: string[], bot: Client) {
  // This allows people to rate their scans and not trigger an error
  if ((devType === 'all' || devType === 'scan') && /^[0-9]/.test(text)) return;

  let name;
  let stats;
  try {
    name = text.split(/\s\d.*/g)[0].trim();
    stats = text.match(/\d+/g)?.map(Number) ?? [];
    if (!stats || stats.length !== 5) throw new Error('');
  } catch (err) {
    return '!rate <Creature> <Courage> <Power> <Wisdom> <Speed> <Energy>';
  }

  return rate(name, stats, options, bot);
}

export function rate(name: string, stats: number[], options: string[], bot: Client) {
  const results = API.find_cards_ignore_comma(name);
  if (results.length <= 0) {
    return "That's not a valid card name";
  }

  const card = results[0];
  if (!isCreature(card)) return `${card.gsx$name} is not a Creature`;
  if (card.gsx$name === "Aa'une the Oligarch, Avatar") return `${card.gsx$name} does not have variable stats.`;

  let error = '';

  if (stats[0] % 5 !== 0) error += 'Courage must be a multiple of 5\n';
  if (stats[0] > Number(card.gsx$courage) + 10 || stats[0] < Number(card.gsx$courage) - 10) {
    error += `Courage must be between ${Number(card.gsx$courage) - 10} and ${Number(card.gsx$courage) + 10}\n`;
  }
  if (stats[1] % 5 !== 0) error += 'Power must be a multiple of 5\n';
  if (stats[1] > Number(card.gsx$power) + 10 || stats[1] < Number(card.gsx$power) - 10) {
    error += `Power must be between ${Number(card.gsx$power) - 10} and ${Number(card.gsx$power) + 10}\n`;
  }
  if (stats[2] % 5 !== 0) error += 'Wisdom must be a multiple of 5\n';
  if (stats[2] > Number(card.gsx$wisdom) + 10 || stats[2] < Number(card.gsx$wisdom) - 10) {
    error += `Wisdom must be between ${Number(card.gsx$wisdom) - 10} and ${Number(card.gsx$wisdom) + 10}\n`;
  }
  if (stats[3] % 5 !== 0) error += 'Speed must be a multiple of 5\n';
  if (stats[3] > Number(card.gsx$speed) + 10 || stats[3] < Number(card.gsx$speed) - 10) {
    error += `Speed must be between ${Number(card.gsx$speed) - 10} and ${Number(card.gsx$speed) + 10}\n`;
  }
  if (stats[4] % 5 !== 0) error += 'Energy must be a multiple of 5\n';
  if (stats[4] > Number(card.gsx$energy) + 5 || stats[4] < Number(card.gsx$energy) - 5) {
    error += `Energy must be between ${Number(card.gsx$energy) - 5} and ${Number(card.gsx$energy) + 5}\n`;
  }

  if (error) return error;

  let courage: string |number;
  let power: string |number;
  let wisdom: string |number;
  let speed: string |number;
  let energy: string |number;
  let total: string |number;

  if (options.includes('king') || options.includes('k')) {
    ([courage, power, wisdom, speed, energy, total] = king(stats, card, options));
  }
  else if (options.includes('smildon') || options.includes('s')) {
    ([courage, power, wisdom, speed, energy, total] = smildon(stats, card));
  }
  else {
    ([courage, power, wisdom, speed, energy, total] = metal(stats, card));
  }

  const icons = new Icons(bot);

  return (`${
    icons.disciplines('Courage')} ${courage}\n${
    icons.disciplines('Power')} ${power}\n${
    icons.disciplines('Wisdom')} ${wisdom}\n${
    icons.disciplines('Speed')} ${speed}\n` +
    `| E |  ${energy}\n` +
    `Total Rating: ${total}`
  );
}
