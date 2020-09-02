import { Client, Message, Snowflake } from 'discord.js';
import moment, { Moment } from 'moment';

import { Channel } from '../../definitions';
import ScanQuestDB, { ActiveScan, Server } from '../scan_db';
import Select from './select';
import debug from '../../common/debug';

/**
 * @param timeout A javascript timer
 * @param duration A numberical representation in miliseconds of the remaining time for the timer
 */
interface Timer {
  timeout: NodeJS.Timeout
  endTime: Moment
}

/**
 * @param amount The number of miliseconds to reduce a timer by
 */
interface Amount {
  amount: number
}

const config = {
  tick: 1.5 * 1000, // seconds in milliseconds
  debounce: 2 * 60 * 1000, // minutes in milliseconds
  // debounce: 10 * 1000,
  next: 8
};

export default class Spawner {
  private readonly timers: Map<Snowflake, Timer> = new Map();
  private readonly debouncer: Map<Snowflake, Amount> = new Map();

  readonly bot: Client;
  readonly db: ScanQuestDB;
  readonly select: Select;

  constructor(bot: Client, db: ScanQuestDB) {
    this.bot = bot;
    this.db = db;
    this.select = new Select();
    this.start();
  }

  start() {
    // get timers from database
    this.db.servers.data.forEach((server) => {
      if (server.remaining) {
        const endTime = moment(server.remaining);
        const remaining = endTime.diff(moment(), 'milliseconds');
        if (remaining > config.debounce) {
          const timeout = setTimeout(() => this.sendCard(server), remaining);
          this.timers.set(server.id, { timeout, endTime });
        }
        else {
          debug(this.bot, 'When starting bot, spawn timer has already expired');
          this.sendCard(server);
        }
      }
    });
  }

  stop() {
    // write timers to database
    this.timers.forEach((timer, id) => {
      const { endTime, timeout } = timer;

      clearTimeout(timeout);

      const amount = (this.debouncer.get(id)?.amount ?? 0);
      endTime.subtract(amount, 'milliseconds');

      this.db.servers.findAndUpdate({ id: id }, (server) => {
        server.remaining = endTime.toDate();
      });
    });
  }

  reroll(message: Message) {
    const id = message.guild.id;
    const server = this.db.servers.findOne({ id });
    if (server) {
      if (this.timers.has(id)) {
        clearTimeout(this.timers.get(id)!.timeout);
      }
      debug(this.bot, `${message.author.username} has issued a reroll`);
      this.sendCard(server);
    }
  }

  // Decrease spawn timer countdown with activity
  // Assign point value to next spawn, size of messages decrease from point value
  tick(message: Message) {
    const id = message.guild.id;
    // only monitor the servers the bot is configured for
    const server = this.db.servers.findOne({ id: id });
    if (!server || (server.ignore_channels?.includes(message.channel.id) ?? true)) return;

    // Ignore short messages
    const content = message.content.replace(/<:.*:[0-9]*>/gi, '');
    const words = content.split(' ').length;
    let length = content.length;

    if (words < 3 || length < 20) return;

    if (length > 400) length = 400;

    // reduces timer by config seconds per character in messaage
    const reduce = (length - 8) * config.tick;

    if (this.debouncer.has(id)) {
      const { amount } = this.debouncer.get(id) as Amount;
      this.debouncer.set(id, { amount: amount + reduce });
    }
    else {
      setTimeout(() => this.reduce(server), config.debounce);
      this.debouncer.set(id, { amount: reduce });
    }
  }

  reduce(server: Server) {
    const { id, send_channel } = server;

    if (this.timers.has(id)) {
      let { timeout, endTime } = this.timers.get(id) as Timer;
      clearTimeout(timeout);

      const amount = (this.debouncer.get(id)?.amount ?? 0);
      endTime.subtract(amount, 'milliseconds');
      const remaining = endTime.diff(moment(), 'milliseconds');

      // eslint-disable-next-line max-len
      debug(this.bot, `<#${send_channel}>: ${moment(endTime).add(amount, 'milliseconds').format('hh:mm:ss')} reduced by ${amount / 1000} seconds.`);

      if (remaining <= config.debounce) {
        debug(this.bot, `Remaining time insufficiant, generating now: ${(new Date()).toLocaleTimeString('en-GB')}`);
        this.sendCard(server);
      }
      else {
        timeout = setTimeout(() => this.sendCard(server), remaining);
        this.timers.set(id, { timeout, endTime });
        this.db.servers.findAndUpdate({ id: id }, (server) => {
          server.remaining = endTime.toDate();
        });
        debug(this.bot, `Timer set for ${endTime.format('hh:mm:ss')}. ${remaining / 1000} seconds remaining.`);
      }
    }

    this.debouncer.delete(id);
  }

  /**
   * Sends a card image to the configed channel
  */
  private sendCard(server: Server) {
    const { id, send_channel } = server;
    try {
      debug(this.bot, `Attempting to generate a scan at ${(new Date()).toLocaleTimeString('en-GB')}`);

      const { scannable, image, duration: active } = this.select.card(server);

      // cleanup old scans
      // note: this is done after generating a new one so that a recently generated scan doesn't get regenerated
      server.activescans = server.activescans.filter(scan => {
        const s = moment(scan.expires).isSameOrAfter(moment().subtract(config.debounce, 'milliseconds'));
        if (!s) debug(this.bot, `${scan.scan.name} expired (${moment(scan.expires).format('hh:mm:ss')})`);
        return s;
      });

      // add to list of active scans
      const expires = moment().add(active, 'hours');

      server.activescans.push(new ActiveScan({ scan: scannable.card, expires: expires.toDate() }));

      // set timer until next spawn
      const duration = Math.min(active, config.next);
      const endTime = moment().add(duration, 'hours');
      server.remaining = endTime.toDate();

      this.db.servers.update(server);

      const timeout = setTimeout(() => this.sendCard(server), endTime.diff(moment()));
      this.timers.set(id, { timeout, endTime });

      (this.bot.channels.get(send_channel) as Channel).send(image).catch(() => {});
    }
    catch (e) {
      debug(this.bot, e, 'errors');
    }
  }
}
