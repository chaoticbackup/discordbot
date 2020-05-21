import { RichEmbed } from 'discord.js';
import { cleantext } from '../../common';

const tiers = ['S', 'A', 'B'] as const;

type Tier = typeof tiers[number]

interface decklists {
  tierlist: Record<Tier, string[]>
  decks: Record<string, {counters: string, url: string}>
  tribes: Record<string, string[]>
}

const { tierlist, decks, tribes } = require('../config/decklists.json') as decklists;

function _tiers(tier?: string) {
  const embed = new RichEmbed();

  if (tier) {
    const t = _tribes(tier);
    if (t) return t;

    tier = cleantext(tier).toUpperCase();

    if (tier === 'CM') tier = 'S';
    if (tier in tiers) {
      let message = '';
      tierlist[tier as Tier].forEach((deck: string) => {
        message += `${deck}: ${decks[deck].url}\n`;
      });
      return embed.addField(`${tier} Decks`, message, true);
    }
    else return 'That is not a tier';
  }

  for (const key in tierlist) {
    let message = '';
    tierlist[key as Tier].forEach((deck: string) => {
      message += `${deck}: ${decks[deck].url}\n`;
    });
    embed.addField(key, message, true);
  }

  return embed;
}

function _tribes(tribe: string) {
  const embed = new RichEmbed();
  tribe = cleantext(tribe);

  for (const key in tribes) {
    if (cleantext(key) === tribe) {
      let message = `**${key} Decks:**\n`;
      tribes[key].forEach((deck: string) => {
        message += `${deck}: ${decks[deck].url}\n`;
      });
      return embed.setDescription(message);
    }
  }
}

export {
  _tiers as tierlist,
  _tribes as tribelist
};
