import { Snowflake, RichEmbed, Message } from 'discord.js';
import users from '../../common/users';

const starters = require('./config/starters.json') as Record<string, Record<string, {name: string, link: string}>>;

export default function (message: Message, options: string[]): RichEmbed {
  const display_starter = (name: string, id: Snowflake) => {
    const starter = starters[name];

    let resp = '';
    Object.keys(starter).forEach((tribe) => {
      resp += `${icon(tribe)} ${tribe}: [${starter[tribe].name}](${starter[tribe].link})\n`;
    });

    const displayName = message.guild?.members.get(id)?.displayName ?? '';
    const title = displayName !== '' ? `${displayName}'s Starters` : 'Starter Decks';
    return new RichEmbed()
      .setTitle(title)
      .setDescription(resp);
  };

  if (options.includes('king'))
    return display_starter('king', users('daddy'));
  else if (options.includes('ivan'))
    return display_starter('ivan', users('brat'));
  return display_starter('metal', users('metal'));
}

function icon(tribe: string): string {
  switch (tribe) {
    case 'OverWorld':
      return '<:OW:294939978897555457>';
    case 'UnderWorld':
      return '<:UW:294943282943885313>';
    case 'Mipedian':
      return '<:Mip:294941790052679690>';
    case 'Danian':
      return '<:Dan:294942889337683968>';
    case "M'arrillian":
      return '<:Mar:294942283273601044>';
    default:
      return '<:TL:294945357392248833>';
  }
}
