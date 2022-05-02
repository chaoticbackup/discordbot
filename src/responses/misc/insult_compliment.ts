import { Guild } from 'discord.js';

import { rndrsp } from '../../common';

import c from './config/compliments.json';
import i from './config/insults.json';

const commands = {
  insult: i,
  compliment: c
};

export function compliment(mentions: string[], name: string, guild?: Guild): string {
  return flirt_dirt('compliment', mentions, name, guild);
}

export function insult(mentions: string[], name: string, guild?: Guild): string {
  if (mentions.includes('279331985955094529'))
  { return ('<:Bodal:401553896108982282> just... <:Bodal:401553896108982282>'); }
  return flirt_dirt('insult', mentions, name, guild);
}

function flirt_dirt(command: 'compliment' | 'insult', mentions: string[], name: string, guild?: Guild): string {
  // Function to replace the mention with the display name
  const insertname = (resp: string) => {
    if (guild && mentions.length > 0) {
      const member = guild.members.get(mentions[0]);
      if (member) name = member.displayName;
    }

    if (name) {
      return resp.replace(/\{\{.+?\|(x*(.*?)|(.*?)x*)\}\}/ig, (_match: any, p1: string) => {
        return p1.replace(/x/i, name);
      });
    }
    return resp.replace(/\{\{(.*?)\|.*?\}\}/ig, (_match: any, p1: string) => { return p1; });
  };

  return insertname(rndrsp(commands[command], command));
}
