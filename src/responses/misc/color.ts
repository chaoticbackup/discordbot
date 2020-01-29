import { Guild, GuildMember } from 'discord.js';
import { cleantext, uppercase } from '../../common';
import { SendFunction } from '../../definitions';

export default async function (args: string[], guild: Guild, guildMember: GuildMember, send: SendFunction): Promise<void> {
  if (args.length < 2) return send('!color <set|remove> <color>');

  switch (cleantext(args[0])) {
    case 'set': {
      const color = guild.roles.find(role => role.name === cleantext(args[1]));
      if (color) {
        await guildMember.addRole(color);
        return send(`Now your name is ${uppercase(args[1])}!`);
      }
      return send("Sorry I don't have that color as a role");
    }
    case 'remove': {
      const color = guild.roles.find(role => role.name === cleantext(args[1]));
      if (color) {
        await guildMember.removeRole(color);
        return send(`Your name is no longer ${uppercase(args[1])}!`);
      }
    }
  }
}
