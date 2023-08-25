import { Guild, GuildMember } from 'discord.js';

import { Channel } from '../definitions';

import servers, { is_channel, is_server } from './servers';

interface can_send_params {
  channel: Channel
  guild?: Guild
  guildMember?: GuildMember
  msg?: string | null
  role?: string
}

/**
 * Main server only. Checks if the channel is bot commands,
 * otherwise asks to use the command in bot commands.
 * @param msg Supply a custom message to send, or `null` if no message is to be sent
 */
export function can_send({
  channel,
  guild,
  guildMember,
  msg,
  role = 'Super Rare'
}: can_send_params): boolean {
  if (guild === undefined) return true;

  if (is_server(guild, 'main') && !is_channel(channel, 'bot_commands')) {
    if (guildMember?.roles.find(({ name }) => name === role)) return true;
    if (msg !== null) {
      channel.send(msg ?? `Please ask me in <#${servers('main').channel('bot_commands')}> :)`)
      .catch(() => {});
    }
    return false;
  }
  return true;
}
