import { Client } from 'discord.js';
import logger from '../logger';
import { Channel } from '../definitions';
import servers from './servers';

type channels = 'debug' | 'errors';

export default function (bot: Client, msg: string, channel: channels = 'debug') {
  // Don't log problems while in development
  if (process.env.NODE_ENV === 'development') {
    logger.info(msg);
    return;
  }
  if (channel === 'errors') {
    logger.error(msg);
  }
  (bot.channels.get(servers('develop').channel(channel)) as Channel)
  .send(msg)
  .catch(logger.error);
}
