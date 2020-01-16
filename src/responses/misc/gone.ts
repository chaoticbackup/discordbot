import { Client, RichEmbed } from 'discord.js';
import { cleantext, rndrsp } from '../../common';
const { Custom, GoneChaotic, Gone2Chaotic, GoneChaotic3 } = require('../config/gonechaotic.json');

export default function(name: string, bot: Client) {
  const merge = Object.assign({}, Custom, GoneChaotic, Gone2Chaotic, GoneChaotic3);

  name = cleantext(name);

  // Skip for loop for speed
  if (name === 'nakan') {
    const line = ''
        + '88' + bot.emojis.find(emoji => emoji.name === 'Courage').toString() + ' '
        + '76' + bot.emojis.find(emoji => emoji.name === 'Power').toString() + ' '
        + '23' + bot.emojis.find(emoji => emoji.name === 'Wisdom').toString() + ' '
        + '41' + bot.emojis.find(emoji => emoji.name === 'Speed').toString() + ' '
        + '| ' + '59' + ' E';

    return new RichEmbed()
      .setTitle('Nakan')
      .setURL(merge.Nakan)
      .setDescription(line)
      .setImage(merge.Nakan);
  }

  if (name) {
    for (var key in merge) {
      if (cleantext(key).indexOf(name) === 0) {
        let line = '';

        if (key === 'Proboscar (Powerful)') {
          line = ''
            + '60' + bot.emojis.find(emoji => emoji.name === 'Courage').toString() + ' '
            + '90' + bot.emojis.find(emoji => emoji.name === 'Power').toString() + ' '
            + '25' + bot.emojis.find(emoji => emoji.name === 'Wisdom').toString() + ' '
            + '85' + bot.emojis.find(emoji => emoji.name === 'Speed').toString() + ' '
            + '| ' + '65' + ' E';
        }

        return new RichEmbed()
          .setTitle(key)
          .setDescription(line)
          .setURL(merge[key])
          .setImage(merge[key]);
      }
    }
    return rndrsp(["Yokkis can't find your card", "I guess that card isn't *gone*"]);
  }

  const card = rndrsp(Object.keys(merge));
  return new RichEmbed()
    .setTitle(card)
    .setURL(merge[card])
    .setImage(merge[card]);
}
