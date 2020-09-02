import { Client, Message, Snowflake, TextChannel, RichEmbed } from 'discord.js';
import moment, { Moment } from 'moment';

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
  safety: 10,
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

  private setSendTimeout(server: Server, endTime: Moment) {
    const { id } = server;
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id)!.timeout);
    }

    const timeout = setTimeout(() => {
      debug(this.bot, 'Timer expired, generating now');
      this.spawnCard(server);
    }, endTime.diff(moment()));
    this.timers.set(server.id, { timeout, endTime });
  }

  start() {
    // get timers from database
    this.db.servers.data.forEach((server) => {
      if (server.remaining) {
        const endTime = moment(server.remaining);
        const remaining = endTime.diff(moment(), 'milliseconds');
        if (remaining > config.debounce) {
          this.setSendTimeout(server, endTime);
        }
        else {
          debug(this.bot, 'When starting bot, spawn timer has already expired');
          this.spawnCard(server);
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
      debug(this.bot, `${message.author.username} has issued a reroll`);
      this.spawnCard(server, true);
    }
  }

  // Decrease spawn timer countdown with activity
  // Assign point value to next spawn, size of messages decrease from point value
  tick = (message: Message) => {
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
  };

  private reduce(server: Server) {
    const { id, send_channel } = server;

    if (this.timers.has(id)) {
      const { endTime } = this.timers.get(id) as Timer;

      const amount = (this.debouncer.get(id)?.amount ?? 0);
      endTime.subtract(amount, 'milliseconds');
      const remaining = endTime.diff(moment(), 'milliseconds');

      // eslint-disable-next-line max-len
      debug(this.bot, `<#${send_channel}>: ${moment(endTime).add(amount, 'milliseconds').format('hh:mm:ss')} reduced by ${amount / 1000} seconds.`);

      if (remaining <= config.debounce) {
        debug(this.bot, 'Remaining time insufficiant, generating now:');
        this.spawnCard(server);
      }
      else {
        this.setSendTimeout(server, endTime);
        this.db.servers.findAndUpdate({ id: id }, (server) => {
          server.remaining = endTime.toDate();
        });
        debug(this.bot, `Timer set for ${endTime.format('hh:mm:ss')}. ${remaining / 1000} seconds remaining.`);
      }
    }

    this.debouncer.delete(id);
  }

  private cleanOldScans(server: Server) {
    const { send_channel, activescans } = server;
    return activescans.filter(({ expires, scan, msg_id }) => {
      // const s = moment(expires).isSameOrAfter(moment().subtract(config.debounce, 'milliseconds'));
      const s = false;
      if (!s) {
        debug(this.bot, `${scan.name} expired (${moment(expires).format('hh:mm:ss')})`);
        if (msg_id) {
          (this.bot.channels.get(send_channel) as TextChannel).fetchMessage(msg_id)
          .then(async (message) => {
            if (message?.editable && message.embeds.length > 0) {
              const embed = new RichEmbed(message.embeds[0]).setTitle('Scan expired');
              await message.edit(embed);
            }
          })
          .catch(() => {});
        }
      }
      return s;
    });
  }

  /**
   * Sends a card image to the configed channel
  */
  private spawnCard(server: Server, force = false) {
    const { send_channel, activescans, last_sent } = server;
    debug(this.bot, `Attempting to generate a scan at ${moment().format('hh:mm:ss')}`);

    if (!force && activescans.length > 0 && last_sent) {
      const d = moment().diff(moment(last_sent), 'minutes');
      if (d < config.safety) {
        this.setSendTimeout(server, moment().add(config.safety, 'minutes'));
        return;
      }
    }

    try {
      const { scannable, image, duration: active } = this.select.card(server);

      // note: this is done after generating a new one so that a recently generated scan doesn't get regenerated
      server.activescans = this.cleanOldScans(server);

      // Min time is to ensure longer spawns don't take too long and no inactive scans for short ones
      const endTime = moment().add(Math.min(active, config.next), 'hours');

      (this.bot.channels.get(send_channel) as TextChannel).send(image)
      .then((message) => {
        // add to list of active scans
        const expires = moment().add(active, 'hours').toDate();
        server.activescans.push(new ActiveScan({ scan: scannable.card, expires, msg_id: message.id }));
        this.setSendTimeout(server, endTime);
        server.remaining = endTime.toDate();
        server.last_sent = moment().toDate();
      })
      .catch((e) => {
        const endTime = moment().add(10, 'minutes');
        this.setSendTimeout(server, endTime);
        server.remaining = endTime.toDate();
        debug(this.bot, e, 'errors');
      })
      .finally(() => {
        this.db.servers.update(server);
      });
    }
    catch (e) {
      debug(this.bot, e, 'errors');
    }
  }
}
