import { Client } from 'discord.js';
import logger from '../logger';
import { Channel } from '../definitions';
import servers from './servers';

type channels = 'debug' | 'errors';

export default function (bot: Client, msg: string, channel: channels = 'debug') {
  if (process.env.NODE_ENV === 'development') {
    logger.info(msg);
    return;
  }
  (bot.channels.get(servers('develop').channel(channel)) as Channel)
  .send(msg)
  .catch((error: any) => { logger.error(error) });
}
