import { Channel } from './../definitions';
import RandomResponse from './RandomResponse';
import { GuildMember, Guild, PermissionResolvable, Message } from "discord.js";

const {servers} = require('../../config/server_ids.json');

export const rndrsp = (new RandomResponse()).rndrsp;

export function uppercase(word: string) {
  return word[0].toUpperCase() + word.slice(1);
}

/**
 * turn lowercase, remove commas and apostrophies
 */
export function cleantext(string: string): string {
  return string.toLowerCase().replace(/[,\'’\-]/g, '');
}

/**
 * escapes parenthasis
 */
export function escape_text(text: string): string {
  return text
    .replace(/\(|\)/g, (match) => {return ("\\"+match)})
    .replace(/’/g, '\'');
}

export async function asyncForEach(array: any[], callback: any) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

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

/* Overloaded */
export function can_send(message: Message, msg?: string): boolean;
export function can_send(guild: Guild, channel: Channel, msg?: string): boolean;
export function can_send(arg1: any, ...rest: any): boolean {
  let guild: Guild;
  let channel: Channel;
  let msg: string;

  if (arg1 instanceof Message) {
    guild = arg1.guild;
    channel = arg1.channel;
    msg = rest;
  }
  else {
    guild = arg1;
    channel = rest[0];
    msg = rest[1] || null;
  }

  if (!guild) return true;
  if (guild.id == servers.main.id && !is_channel("main", channel, "bot_commands")) {
    channel.send(msg || "To be curtious to other conversations, ask me in <#387805334657433600> :)");
    return false;
  }
  return true;
};


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