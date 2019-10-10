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
export function can_send<A extends Message | Guild, B extends Channel | undefined>
(arg1: A, arg2: B, msg?: string): boolean {
  let guild: Guild | undefined;
  let channel: Channel | undefined;

  if (arg1 instanceof Message) {
    guild = arg1.guild;
    channel = arg1.channel;
  }
  else {
    guild = (arg1 instanceof Guild) ? arg1 : undefined;
    channel = (arg2 as Channel) ? arg2 : undefined;
  }

  if (!guild) return true;
  if (!channel) return false;
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