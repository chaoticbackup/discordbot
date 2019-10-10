import { Guild, GuildMember } from 'discord.js';
import { SendFunction } from './definitions';

import {cleantext, uppercase} from './common';

export default function(args: string[], guild: Guild, guildMember: GuildMember, send: SendFunction) {
    if (args.length < 2) return;
    
    switch(cleantext(args[0])) {
      case 'set': {
        const color = guild.roles.find(role => role.name == cleantext(args[1]));
        if (color) {
          guildMember.addRole(color);
          send(`Now your name is ${uppercase(args[1])}!`);
        }
        else send("Sorry I don't have that color role");
      }
      break;
      case 'remove': {
          const color = guild.roles.find(role => role.name == cleantext(args[1]));
          if (color) {
            guildMember.removeRole(color);
          }
        }
      break;
    }
    return;
}