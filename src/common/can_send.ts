import { Guild, Message, GuildMember } from 'discord.js';
import { Channel } from '../definitions';
import { is_channel } from './is_channel';
import servers from './servers';
import { messageGuild } from './parseMessageGuild';

type msg = string | null | undefined;

/**
 * Main server only. Checks if the channel is bot commands,
 * otherwise asks to use the command in bot commands.
 * @param msg Supply a custom message to send, or `null` if no message is to be sent
 */
export async function can_send(message: Message, msg?: string | null): Promise<boolean>;
export async function can_send(guild: Guild, channel: Channel, msg?: string | null): Promise<boolean>;
export async function can_send<
  A extends Message | Guild | undefined, B extends Channel | msg
>(
  arg1: A, arg2: B, arg3?: string | null
): Promise<boolean> {
  let guild: Guild | undefined;
  let channel: Channel;
  let msg: msg;
  let guildMember: GuildMember | undefined;

  if (arg1 instanceof Message) {
    const t = await messageGuild(arg1);
    guild = t.guild;
    guildMember = t.guildMember;
    channel = arg1.channel;
    msg = arg2 as msg;
  }
  else {
    guild = arg1 as Guild | undefined;
    channel = arg2 as Channel;
    msg = arg3;
  }

  if (guild === undefined) return true;

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
