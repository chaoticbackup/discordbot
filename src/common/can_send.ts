import { Guild, GuildMember } from 'discord.js';
import { Channel } from '../definitions';
import { is_channel } from './is_channel';
import servers from './servers';

type msg = string | null | undefined;

/**
 * Main server only. Checks if the channel is bot commands,
 * otherwise asks to use the command in bot commands.
 * @param msg Supply a custom message to send, or `null` if no message is to be sent
 */
export function can_send(channel: Channel, guild: Guild | undefined, msg?: string | null): boolean;
export function can_send(channel: Channel, guild: Guild | undefined, guildMember?: GuildMember, msg?: string | null): boolean;
export function can_send(channel: Channel, guild?: Guild, arg3?: GuildMember | msg, arg4?: string | null): boolean {
  let msg: msg;
  let guildMember: GuildMember | undefined;

  if (guild === undefined) return true;

  if (arg3 instanceof GuildMember) {
    guildMember = arg3;
    msg = arg4;
  }
  else if (arg3 !== undefined) {
    msg = arg3;
  }
  // The third param can be undefined if not in a guild
  // If so check forth param for the msg
  else {
    msg = arg4;
  }

  if (guild.id === servers('main').id && !is_channel(channel, 'bot_commands')) {
    if (guildMember?.roles.find(role => role.name === 'Super Rare')) return true;
    if (msg !== null) {
      channel.send(msg ?? `Please ask me in <#${servers('main').channel('bot_commands')}> :)`)
      .catch(() => {});
    }
    return false;
  }
  return true;
}
