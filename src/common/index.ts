import { Guild, GuildMember, PermissionResolvable } from 'discord.js';
import RandomResponse from './RandomResponse';
import logger from '../logger';

export const { rndrsp } = new RandomResponse();
export * from './can_send';
export * from './donate';
export * from './servers';
export * from './users';

/**
 * This function turns a send message error into a log
 */
export function msgCatch(error: any) {
  logger.error(error.stack);
}

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

// Takes the arg list and turns it into lowercase string
export function flatten(args: string[]): string {
  return (args.join(' ')).toLowerCase();
}

/**
 * escapes parenthesis
 */
export function escape_text(text: string): string {
  return text
  .replace(/\(|\\|\)/g, (match) => { return (`\\${match}`); })
  .replace(/’/g, '\'')
  .replace(/\*/g, '');
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

export function isModerator(member?: GuildMember): boolean {
  return !!member && Boolean(
    member.roles.find(role => role.name === 'Administrator') ||
    member.roles.find(role => role.name === 'Moderator')
  );
}

export function hasPermission(guild: Guild | undefined, permission: PermissionResolvable): boolean {
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

// This function gets around implicit any when no index signature
export function keys<O extends object>(obj: O): Array<keyof O> {
  return Object.keys(obj) as Array<keyof O>;
}

export function stripMention(arg: string) {
  return arg.replace('@', '');
}
