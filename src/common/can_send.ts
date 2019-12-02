import { Guild, Message } from "discord.js";
import { Channel } from '../definitions';
import { is_channel } from './is_channel';
import servers from './servers';

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
  if (guild.id === servers("main").id && !is_channel(channel, "bot_commands")) {
    if (msg !== null) {
      channel.send(msg || `To be courteous to other conversations, ask me in <#${servers("main").channel("bot_commands")}> :)`);
    }
    return false;
  }
  return true;
};
