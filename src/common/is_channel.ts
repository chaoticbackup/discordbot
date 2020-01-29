import { Message, TextChannel } from 'discord.js';
import { Channel } from '../definitions';
import servers from './servers';

/**
 * Checks whether a channel is the specified name
 * @param guild Optionally specify which guild this channel should be in (default main)
 */
export function is_channel(message: Message, name: string): boolean;
export function is_channel(channel: Channel, name: string, guild?: string): boolean;
export function is_channel<A extends Message | Channel>(arg1: A, name: string, guild?: string) {
  if (arg1 instanceof Message) {
    const channel = arg1.channel;
    if (channel instanceof TextChannel) {
      return (channel.name === name);
    }
    return false;
  }
  else if (arg1 instanceof TextChannel) {
    const channel = arg1;
    if (!guild) guild = 'main';
    const server = servers(guild);
    if (Object.keys(server.channels).length === 0) return false;
    return channel.id === server.channel(name);
  }

  return false;
}
