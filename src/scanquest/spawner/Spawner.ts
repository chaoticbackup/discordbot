import { Client, Message, Snowflake, TextChannel, RichEmbed } from 'discord.js';
import moment, { Moment } from 'moment';

import ScanQuestDB, { ActiveScan, Server } from '../database';
import Select from './Select';
import debug from '../../common/debug';
import custom from './custom';
import { Scannable } from '../scan_type/Scannable';
import { msgCatch } from '../../common';

/**
 * @tick seconds in milliseconds
 * @debounce minutes in milliseconds
 * @safety minutes
 * @next hours
 * @activity_window minutes in milliseconds
 */
const config = {
  tick: 1.5 * 1000,
  debounce: 2 * 60 * 1000,
  // debounce: 10 * 1000,
  safety: 10,
  next: 2, // TODO PARTY
  activity_window: 15 * 60 * 1000
};

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

/**
 * This is used for calculating activity "density"
 */
interface Activity {
  timestamp: Moment
  amount: number
}

const date_format = 'hh:mm:ss A';

export default class Spawner {
  private readonly timers: Map<Snowflake, Timer> = new Map();
  private readonly debouncer: Map<Snowflake, Amount> = new Map();
  private readonly last_sent: Map<Snowflake, Moment> = new Map();
  private readonly activity: Map<Snowflake, Activity[]> = new Map();

  readonly bot: Client;
  readonly db: ScanQuestDB;
  readonly select: Select;

  constructor(bot: Client, db: ScanQuestDB) {
    this.bot = bot;
    this.db = db;
    this.select = new Select();
  }

  async start() {
    // get timers from database
    const servers = this.db.servers.find({ disabled: false });
    await servers.forEach((server) => {
      this.startTimer(server);
    });
  }

  async stop() {
    // write timers to database
    for (const [id, timer] of this.timers) {
      const { endTime, timeout } = timer;

      clearTimeout(timeout);

      const amount = (this.debouncer.get(id)?.amount ?? 0);
      endTime.subtract(amount, 'milliseconds');

      await this.db.servers.updateOne(
        { id: id },
        { $set: { remaining: endTime.toDate() } }
      );
    }
  }

  public clearTimeout(server: Server) {
    if (this.timers.has(server.id)) {
      clearTimeout(this.timers.get(server.id)!.timeout);
    }
  }

  private setSendTimeout(server: Server, endTime: Moment) {
    this.clearTimeout(server);

    const timeout = setTimeout(() => {
      debug(this.bot, `<#${server.send_channel}>: Timer expired, generating now`);
      this.newSpawn(server);
    }, endTime.diff(moment()));
    this.timers.set(server.id, { timeout, endTime });
  }

  public startTimer(server: Server) {
    if (server.remaining) {
      const endTime = moment(server.remaining);
      const remaining = endTime.diff(moment(), 'milliseconds');
      if (remaining > config.debounce) {
        this.setSendTimeout(server, endTime);
      }
      else {
        debug(this.bot, `When starting scanquest for <#${server.send_channel}>, existing spawn timer had already expired`);
        this.newSpawn(server);
      }
    }
  }

  public async reroll(message: Message) {
    const { id } = message.guild;
    const server = await this.db.servers.findOne({ id });
    if (server) {
      if (server.disabled) {
        message.channel.send('Scanquest is disabled on this server').catch(msgCatch);
        return;
      }
      debug(this.bot, `${message.author.username} has issued a reroll`);
      this.newSpawn(server, true);
    }
  }

  public async spawn(message: Message, args: string[], options: string[]) {
    await custom.call(this, message, args, options);
  }

  public async list(message: Message) {
    const s = await this.db.servers.findOne({ id: message.guild.id });
    return s?.activescans.map(sc => `${sc.scan.name} (${moment(sc.expires).format(date_format)}) #${sc.msg_id}`).concat('\n');
  }

  // Decrease spawn timer countdown with activity
  // Assign point value to next spawn, size of messages decrease from point value
  public async tick(message: Message) {
    const { id } = message.guild;
    // only monitor the servers the bot is configured for
    const server = await this.db.servers.findOne({ id: id });
    if (!server || (server.ignore_channels?.includes(message.channel.id) ?? true)) return;

    // Ignore short messages
    const content = message.content.replace(/<:.*:[0-9]*>/gi, '');
    const words = content.split(' ').length;
    let { length } = content;

    if (words < 3 || length < 20) return;

    if (length > 400) length = 400;

    // reduces timer by config seconds per character in messaage
    const reduce = (length - 8) * config.tick;

    if (this.debouncer.has(id)) {
      const { amount } = this.debouncer.get(id)!;
      this.debouncer.set(id, { amount: amount + reduce });
    }
    else {
      setTimeout(() => {
        this.reduce(server).catch(() => {});
      }, config.debounce);
      this.debouncer.set(id, { amount: reduce });
    }
  }

  private setActivity(server: Server) {
    const { id } = server;

    const now = moment();

    let activities = this.activity.get(id) ?? [];

    activities = activities.filter(value => now.diff(value.timestamp, 'minutes') <= config.activity_window);

    const amount = (this.debouncer.get(id)?.amount ?? 0);
    activities.push({ timestamp: now, amount });

    this.activity.set(id, activities);
  }

  private async reduce(server: Server) {
    this.setActivity(server);

    const { id, send_channel } = server;

    if (this.timers.has(id)) {
      const { endTime } = this.timers.get(id) as Timer;

      const amount = (this.debouncer.get(id)?.amount ?? 0);
      endTime.subtract(amount, 'milliseconds');
      const remaining = endTime.diff(moment(), 'milliseconds');

      let db_msg = `<#${send_channel}>: ${moment(endTime).add(amount, 'milliseconds').format(date_format)} reduced by ${amount / 1000} seconds.\n`;

      if (remaining <= config.debounce) {
        db_msg += 'Remaining time insufficiant, generating now...';
        this.newSpawn(server);
      }
      else {
        this.setSendTimeout(server, endTime);
        await this.db.servers.updateOne(
          { id: id },
          { $set: { remaining: endTime.toDate() } }
        );
        db_msg += `Timer set for ${endTime.format(date_format)}. ${remaining / 1000} seconds remaining.`;
      }
      debug(this.bot, db_msg);
    }

    this.debouncer.delete(id);
  }

  private cleanOldScans(server: Server) {
    const { send_channel, activescans } = server;
    return activescans.filter(({ expires, scan, msg_id }) => {
      const s = moment(expires).isSameOrAfter(moment().subtract(config.debounce, 'milliseconds'));
      if (!s) {
        debug(this.bot, `${scan.name} expired (${moment(expires).format(date_format)})`);
        if (msg_id) {
          (this.bot.channels.get(send_channel) as TextChannel).fetchMessage(msg_id)
          .then(async (message) => {
            if (message?.editable && message.embeds.length > 0) {
              const embed = new RichEmbed(message.embeds[0]);
              this.select.setTitle(embed, 0);
              await message.edit(embed);
            }
          })
          .catch(msgCatch);
        }
      }
      return s;
    });
  }

  protected newSpawn(server: Server, force = false) {
    const { activescans, send_channel, disabled, id } = server;
    if (disabled) {
      debug(this.bot, `<#${send_channel}>: Scanquest is disabled on this server`);
      return;
    }

    if (!force && activescans.length > 0 && this.last_sent.has(id)) {
      debug(this.bot, `<#${send_channel}>: Recently generated a scan for server`);

      const d = moment().diff(moment(this.last_sent.get(id)), 'minutes');
      if (d < config.safety) {
        this.setSendTimeout(server, moment().add(config.safety, 'minutes'));
        return;
      }
    }

    debug(this.bot, `<#${send_channel}>: Attempting to generate a scan at ${moment().format(date_format)}`);

    this.last_sent.set(id, moment());

    let amount = 0;
    if (this.activity.has(id)) {
      this.activity.get(id)!.forEach(v => { amount += v.amount; });
    }

    // TODO can be removed after determining weight
    debug(this.bot, `Amount of value in the previous interval: ${amount}`);

    try {
      const { scannable, image, active } = this.select.card(server, amount);
      this.spawnCard(server, scannable, image, active);
    }
    catch (e) {
      debug(this.bot, e.message, 'errors');
    }
  }

  protected expiresToDate(active: number): Date {
    return moment().add(active, 'hours').toDate();
  }

  /**
   * Sends a card image to the configed channel
   * @param active hours
  */
  protected spawnCard(server: Server, scannable: Scannable, image: RichEmbed, active: number) {
    const { send_channel } = server;
    let remaining: Date;

    const expires = this.expiresToDate(active);

    // note: this is done after generating a new one so that a recently generated scan doesn't get regenerated
    const activescans = this.cleanOldScans(server);

    (this.bot.channels.get(send_channel) as TextChannel).send(new RichEmbed().setDescription('Spawning...'))
    .then(async (message) => {
      debug(this.bot, `<#${send_channel}>: Generated ${scannable.card.name} active until ${moment(expires).format(date_format)} at ${moment().format(date_format)}`);

      // add to list of active scans
      activescans.push(new ActiveScan({ scan: scannable.card, expires, msg_id: message.id }));

      const res = await this.db.servers.updateOne(
        { id: server.id },
        { $set: { activescans } }
      );

      if (!res.acknowledged) {
        throw new Error('DB could not update server active scans');
      }

      // Update the message to reflect the spawned instance
      await message.edit(image);

      // Min time is to ensure longer spawns don't take too long and no inactive scans for short ones
      const endTime = moment().add(Math.min(active, config.next), 'hours');
      this.setSendTimeout(server, endTime);
      remaining = endTime.toDate();
    })
    .catch((e) => {
      const endTime = moment().add(10, 'minutes');
      this.setSendTimeout(server, endTime);
      remaining = endTime.toDate();
      debug(this.bot, e, 'errors');
    })
    .finally(() => {
      this.db.servers.updateOne(
        { id: server.id },
        { $set: { remaining } }
      ).catch((e) => {
        debug(this.bot, e, 'errors');
      });
    });
  }
}
