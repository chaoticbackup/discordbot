import { Client } from 'discord.js';
import moment, { Moment } from 'moment';

import { Channel } from '../definitions';
import logger from '../logger';

import servers from './servers';

type channels = 'debug' | 'errors';

export function handleError(bot: Client, e: any, source = 'unknown') {
  debug(bot, `${source}: ${e.message}\n${e.stack}`, 'errors');
}

const date_format = 'hh:mm:ss A';

export function formatTimestamp(date: Moment): string {
  return `<t:${date.unix()}:T>`;
}

export default function debug(bot: Client, channelmsg: string, channel: channels = 'debug') {
  let logmsg;
  try {
    logmsg = channelmsg.replaceAll(/<t:(.*?):T>/g, (_, cap) => { return moment.unix(cap).format(date_format); });
  } catch (e) {
    logger.error(e.stack);
    logmsg = channelmsg;
  }

  // Don't log problems while in development
  if (process.env.NODE_ENV === 'development') {
    (channel === 'errors') ? logger.error(logmsg) : logger.info(logmsg);
    return;
  }
  if (channel === 'errors') {
    logger.error(logmsg);
  }
  (bot.channels.get(servers('develop').channel(channel)) as Channel)
  .send(channelmsg)
  .catch(logger.error);
}
