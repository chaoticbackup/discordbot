import { Guild, GuildMember, PermissionResolvable } from 'discord.js';
import RandomResponse from './RandomResponse';

export const rndrsp = (new RandomResponse()).rndrsp;
export * from './can_send';
export * from './is_channel';

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
  return string.toLowerCase().replace(/[,\'’\-\@]/g, '');
}

// Takes the arg list and turns it into cleaned text
export function flatten(args: string[]): string {
  return (args.join(' ')).toLowerCase();
}

/**
 * escapes parenthesis
 */
export function escape_text(text: string): string {
  return text
  .replace(/\(|\)/g, (match) => { return (`\\${match}`) })
  .replace(/’/g, '\'');
}

// https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
export async function asyncForEach(array: any[], callback: any) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export function reload(module: any) {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete require.cache[require.resolve(module)];
  return require(module);
}

export function isModerator(member: GuildMember): boolean {
  return Boolean(
    member.roles.find(role => role.name === 'Administrator') ||
    member.roles.find(role => role.name === 'Moderator') ||
    member.roles.find(role => role.name === 'Sectional Mod')
  );
}

export function hasPermission(guild: Guild, permission: PermissionResolvable): boolean {
  if (!guild) return false;
  return guild.me.hasPermission(permission);
}

export function tribe_plural(tribe: string) {
  switch (tribe) {
    case 'Danian':
      return 'Danians';
    case 'Mipedian':
      return 'Mipedians';
    case 'M\'arrillian':
      return 'M\'arrillians';
    case 'OverWorld':
    case 'OverWorlder':
      return 'OverWorlders';
    case 'UnderWorld':
    case 'UnderWorlder':
      return 'UnderWorlders';
    default:
      return tribe;
  }
}
