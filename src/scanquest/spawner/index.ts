import { Client, Message, Snowflake } from 'discord.js';
import moment from 'moment';

import { Channel } from '../../definitions';
import ScanQuestDB, { ActiveScan, Server } from '../scan_db';
import Select from './select';
import servers from '../../common/servers';

/**
 * @param timeout A javascript timer
 * @param duration A numberical representation in miliseconds of the remaining time for the timer
 */
interface Timer {
  timeout: ReturnType<typeof setTimeout>
  duration: number
}

/**
 * @param amount The number of miliseconds to reduce a timer by
 */
interface Amount {
  amount: number
}

const config = {
  tick: 2 * 1000, // seconds
  debounce: 2 * 60 * 1000, // minutes
  next: 8 * 60 * 60 * 1000 // hours
}

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
        const duration = (new Date(server.remaining)).getTime() - (new Date()).getTime();
        if (duration > 1000) {
          const timeout = setTimeout(() => this.sendCard(server), duration);
          this.timers.set(server.id, { timeout, duration });
        }
        else {
          this.sendCard(server);
        }
      }
    });
  }

  stop() {
    // write timers to database
    this.timers.forEach((timer, id) => {
      let { duration, timeout } = timer;
      clearTimeout(timeout);
      duration -= this.debouncer.get(id)?.amount ?? 0;

      this.db.servers.findAndUpdate({ id: id }, (server) => {
        const remaining = moment().add(duration, 'milliseconds');
        server.remaining = remaining.toDate();
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
    if (words < 3 || content.length < 20) return;

    // reduces timer by config seconds per character in messaage
    const reduce = (content.length - 5) * config.tick;

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
    const { id } = server;
    if (this.timers.has(id)) {
      let { timeout, duration } = this.timers.get(id) as Timer;
      clearTimeout(timeout);

      const amount = this.debouncer.get(id)?.amount ?? 0;
      duration -= amount;

      if (duration <= config.debounce) {
        this.sendCard(server);
      }
      else {
        timeout = setTimeout(() => this.sendCard(server), duration);
        this.timers.set(id, { timeout, duration });
        this.db.servers.findAndUpdate({ id: id }, (server) => {
          const remaining = moment().add(duration, 'milliseconds');
          server.remaining = remaining.toDate();
        });
      }
    }

    this.debouncer.delete(id);
  }

  /**
   * Sends a card image to the configed channel
  */
  private sendCard(server: Server) {
    const { id, send_channel } = server;
    const { scannable, image, duration: active } = this.select.card(server);

    // set time active
    const expires = moment().add(active, 'hours');

    // cleanup old scans
    // give or take a minute
    const now = moment().subtract(1, 'minute');

    server.activescans = server.activescans.filter(scan => {
      return moment(scan.expires).isSameOrAfter(now);
      // return (new Date(scan.expires) >= now.toDate());
    });
    // add to list of active scans
    server.activescans.push(new ActiveScan({ scan: scannable.card, expires: expires.toDate() }));

    const duration = config.next;
    const remaining = moment().add(duration, 'milliseconds');
    server.remaining = remaining.toDate();

    this.db.servers.update(server);

    (this.bot.channels.get(send_channel) as Channel).send(image).catch(() => {});
    (this.bot.channels.get(servers('develop').channel('errors')) as Channel).send(scannable.toString()).catch(() => {});

    const timeout = setTimeout(() => this.sendCard(server), duration);
    this.timers.set(id, { timeout, duration });
  }
}
