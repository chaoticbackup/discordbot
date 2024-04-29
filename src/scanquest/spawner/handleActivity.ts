import { Message } from 'discord.js';
import moment from 'moment';
import { WithId } from 'mongodb';

import debug, { formatTimestamp } from '../../common/debug';
import { Server } from '../database';

import config from './config';
import Spawner from './Spawner';

export default function handleActivity(this: Spawner) {
  const reduce = async (server: WithId<Server>) => {
    const { id, send_channel } = server;

    // If another source spawns, they should delete the debounce id,
    // in that case, no need to reduce
    if (!this.debouncer.has(id)) return;
    this.calculateActivity(id);

    const amount = (this.debouncer.get(id)?.amount ?? 0);
    this.debouncer.delete(id);

    if (this.timers.has(id)) {
      // Prevents ticking down of safety period
      if (
        this.last_sent.has(id) &&
        moment().diff(moment(this.last_sent.get(id)), 'minutes') < config.safety
      ) return;

      const { endTime, timeout } = this.timers.get(id)!;
      clearTimeout(timeout);

      endTime.subtract(amount, 'milliseconds');
      const remaining = endTime.diff(moment(), 'milliseconds');

      let db_msg = `<#${send_channel}>: ${formatTimestamp(moment(endTime).add(amount, 'milliseconds'))} reduced by ${amount / 1000} seconds.`;
      if (remaining <= config.debounce) {
        db_msg += '\nRemaining time insufficiant, generating now...';
        debug(this.bot, db_msg);
        this.newSpawn(id);
      }
      else {
        db_msg += ` ${remaining / 1000} seconds remaining.`;
        debug(this.bot, db_msg);
        this.setSendTimeout(server, endTime);
        await this.db.servers.updateOne(
          { id },
          { $set: { remaining: endTime.toDate() } }
        );
      }
    }
  };

  // Decrease spawn timer countdown with activity
  // Assign point value to next spawn, size of messages decrease from point value
  const tick = async (message: Message) => {
    const { id } = message.guild;
    // only monitor the servers the bot is configured for
    const server = await this.db.servers.findOne({ id });
    if (!server || (server.ignore_channels?.includes(message.channel.id) ?? true)) return;

    // Ignore short messages
    const content = message.content.replace(/<:.*:[0-9]*>/gi, '');
    const words = content.split(' ').length;
    let { length } = content;

    if (words < 3 || length < 20) return;

    if (length > 400) length = 400;

    // reduces timer by config seconds per character in messaage
    const reducing = (length - 8) * config.tick;

    if (this.debouncer.has(id)) {
      const { amount } = this.debouncer.get(id)!;
      this.debouncer.set(id, { amount: amount + reducing });
    }
    else {
      setTimeout(() => {
        reduce(server).catch(e => this.handleError(e, id));
      }, config.debounce);
      this.debouncer.set(id, { amount: reducing });
    }
  };

  return tick;
}
