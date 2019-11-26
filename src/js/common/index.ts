import { Channel } from './../definitions';
import RandomResponse from './RandomResponse';
import { GuildMember, Guild, PermissionResolvable, Message, TextChannel } from "discord.js";

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
    member.roles.find(role => role.name==="Moderator") ||
    member.roles.find(role => role.name==="Sectional Mod")
  );
}

export function hasPermission(guild: Guild, permission: PermissionResolvable): boolean {
  if (!guild) return false;
  return guild.me.hasPermission(permission);
}

/**
 * Checks whether a channel is the specified name
 * @param guild Optionally specify which guild this channel should be in (default main)
 */
export function is_channel(message: Message, name: string): boolean;
export function is_channel(channel: Channel, name: string, guild?: string): boolean ;
export function is_channel<A extends Message | Channel>
(arg1: A, name: string, guild?: string) {

  if (arg1 instanceof Message) {
    let channel = arg1.channel;
    if (channel instanceof TextChannel) {
      return (channel.name === name);
    }
    return false;
  }
  else if (arg1 instanceof TextChannel) {
    let channel = arg1;
    if (!guild) guild = "main";
    if (!servers[guild]) return false;
    if (!servers[guild].hasOwnProperty("channels")) return false;
    return channel.id == servers[guild].channels[name];
  }

  return false;
}

/**
 * Main server only. Checks if the channel is bot commands,
 * otherwise asks to use the command in bot commands.
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
  if (guild.id === servers.main.id && !is_channel(channel, "bot_commands")) {
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
