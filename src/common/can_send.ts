/* eslint-disable max-len */
import { Guild, Message, GuildMember } from 'discord.js';
import { Channel } from '../definitions';
import { is_channel } from './is_channel';
import servers from './servers';
import { messageGuild } from './parseMessageGuild';

/**
 * Main server only. Checks if the channel is bot commands,
 * otherwise asks to use the command in bot commands.
 * @param msg Supply a custom message to send, or `null` if no message is to be sent
 */
export async function can_send(message: Message, msg?: string | null): Promise<boolean>;
export async function can_send(guild: Guild | undefined, channel: Channel | undefined, msg?: string | null): Promise<boolean>;
export async function can_send<A extends Message | Guild | undefined, B extends Channel | undefined>(arg1: A, arg2: B, msg?: string | null): Promise<boolean> {
  let guild: Guild | undefined;
  let channel: Channel | undefined;
  let guildMember: GuildMember | undefined;

  if (arg1 instanceof Message) {
    const t = await messageGuild(arg1);
    guild = t.guild;
    guildMember = t.guildMember;
    channel = arg1.channel;
  }
  else {
    guild = (arg1 instanceof Guild) ? arg1 : undefined;
    channel = (arg2 as Channel) ? arg2 : undefined;
  }

  if (!guild) return true;
  if (!channel) return false;

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
