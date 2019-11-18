import { Channel } from './../definitions';
import RandomResponse from './RandomResponse';
import { GuildMember, Guild, PermissionResolvable, Message } from "discord.js";

const {servers} = require('../../config/server_ids.json');

export const rndrsp = (new RandomResponse()).rndrsp;

export {default as db_path} from './db_path';

/**
 * turns the first letter uppercase
 */
export function uppercase(word: string) {
  return word[0].toUpperCase() + word.slice(1);
}

/**
 * turn lowercase, remove commas and apostrophes
 */
export function cleantext(string: string): string {
  return string.toLowerCase().replace(/[,\'’\-]/g, '');
}

/**
 * escapes parenthesis
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
  if (!(guild && servers[guild])) return false;
  if (!servers[guild].hasOwnProperty("channels")) return false;
  return channel.id == servers[guild].channels[name];
}

/**
 * @param msg Supply a custom message to send, or `null` if no message is to be sent
 */
export function can_send(message: Message, msg?: string | null): boolean;
export function can_send(guild: Guild, channel: Channel, msg?: string | null): boolean;
export function can_send<A extends Message | Guild, B extends Channel | undefined>
(arg1: A, arg2: B, msg?: string | null): boolean {
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
  console.log(guild.id);
  if (guild.id === servers.main.id && !is_channel("main", channel, "bot_commands")) {
    if (msg !== null) {
      channel.send(msg || `To be courteous to other conversations, ask me in <#${servers.main.channels.bot_commands}> :)`);
    }
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
