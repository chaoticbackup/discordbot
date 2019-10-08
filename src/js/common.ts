import { GuildMember, Guild, Channel, PermissionResolvable } from "discord.js";

const {servers} = require('../config/server_ids.json');

export function uppercase(word: string) {
  return word[0].toUpperCase() + word.slice(1);
}

/**
 * turn lowercase, remove commas and apostrophies
 */
export function cleantext(string: string): string {
  return string.toLowerCase().replace(/[,\'’\-]/g, '');
}

export function escape_text(text: string) {
  return text
    .replace(/\(|\)/g, (match) => {return ("\\"+match)})
    .replace(/’/g, '\'');
}

export async function asyncForEach(array: any[], callback: any) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export function tribe_plural(tribe: string) {
    switch (tribe) {
        case 'Danian':
            return "Danians";
        case 'Mipedian':
            return "Mipedians";
        case `M'arrillian`:
            return `M'arrillians`;
        case "OverWorld":
        case "OverWorlder":
            return "OverWorlders";
        case "UnderWorld":
        case "UnderWorlder":
            return "UnderWorlders";
        default:
            return tribe;
    }
}

class RandomResponse {
  sr: any = {}; // stored responses

  rndrsp = (items: any, command?: any) => {
    let sr: any = this.sr;

    if (items.length == 1) return items[0];

    if (!command) {
      return items[Math.floor(Math.random()*items.length)];
    }
  
    if (!sr[command]) sr[command] = [];
  
    let rand = Math.floor(Math.random()*items.length);

    // if all response already used, repeat
    if (items.length < sr[command].length + 2) {
      // don't repeat recently used response
      while (sr[command].includes(rand)) {
        rand = Math.floor(Math.random()*items.length);
      }
      sr[command].push(rand); // add to just used array
  
      setTimeout(
        (() => sr[command].shift()).bind(this),
        Math.ceil(items.length / 5) * 1000
      );
    }
  
    return items[rand];
  }
}

export const rndrsp = (new RandomResponse()).rndrsp;

export function reload(module: any) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

export function isModerator(member: GuildMember): boolean {
  return Boolean(
   member.roles.find(role => role.name==="Administrator") ||
   member.roles.find(role => role.name==="Moderator")
  );
}

export const hasPermission = (guild: Guild, permission: PermissionResolvable): boolean => {
  if (!guild) return false;
  return guild.me.hasPermission(permission);
}

export function is_channel(guild: string, channel: Channel, name: string): boolean {
  if (!(name && guild && servers[guild])) return false;
  return channel.id == servers[guild].channels[name];
}

