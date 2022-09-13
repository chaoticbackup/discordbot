import { Client, Message, Snowflake, TextChannel, RichEmbed, Guild } from 'discord.js';
import moment, { Moment } from 'moment';
import { WithId } from 'mongodb';

import { msgCatch } from '../../common';
import debug, { formatTimestamp, handleError } from '../../common/debug';
import ScanQuestDB, { ActiveScan, Server } from '../database';

import custom from './custom';
import Select, { Selection } from './Select';

/**
 * @tick seconds in milliseconds
 * @debounce minutes in milliseconds
 * @safety minutes
 * @activity_window minutes in milliseconds
 */
const config = {
  tick: 1.8 * 1000,
  debounce: 2 * 60 * 1000,
  // debounce: 10 * 1000,
  safety: 10,
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
    this.select = new Select(db);
  }

  async start() {
    // get timers from database
    const servers = this.db.servers.find({ disabled: false });
    await servers.forEach(this.startTimer.bind(this));
  }

  async stop() {
    // write timers to database
    for (const [id, timer] of this.timers) {
      const { endTime, timeout } = timer;

      clearTimeout(timeout);

      const amount = (this.debouncer.get(id)?.amount ?? 0);
      endTime.subtract(amount, 'milliseconds');

      await this.db.servers.updateOne(
        { id },
        { $set: { remaining: endTime.toDate() } }
      );
    }
  }

  protected handleError(e: any, arg1: Server | Guild) {
    let source;
    if (arg1 instanceof Server) {
      source = this.bot.guilds.find((g) => g.id === arg1.id).name;
    }
    else if (arg1 instanceof Guild) {
      source = arg1.name;
    }
    handleError(this.bot, e, source);
  }

  public clearTimeout(server: WithId<Server>) {
    if (this.timers.has(server.id)) {
      clearTimeout(this.timers.get(server.id)!.timeout);
    } else {
      debug(this.bot, `Could not clear timer for ${server.id}`);
    }
  }

  public setSendTimeout(server: WithId<Server>, endTime: Moment) {
    this.clearTimeout(server);

    const timeout = setTimeout(() => {
      debug(this.bot, `<#${server.send_channel}>: Timer expired, generating now`);
      this.newSpawn(server).catch(e => this.handleError(e, server));
    }, endTime.diff(moment()));
    this.timers.set(server.id, { timeout, endTime });
  }

  public startTimer(server: WithId<Server>) {
    if (server.remaining) {
      const endTime = moment(server.remaining);
      const remaining = endTime.diff(moment(), 'milliseconds');
      if (remaining > config.debounce) {
        this.setSendTimeout(server, endTime);
      }
      else {
        debug(this.bot, `When starting scanquest for <#${server.send_channel}>, existing spawn timer had already expired`);
        this.newSpawn(server).catch(e => this.handleError(e, server));
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
      await this.newSpawn(server, true);
    }
  }

  public async spawn(message: Message, args: string[], options: string[]) {
    await custom.call(this, message, args, options).catch(e => this.handleError(e, message.guild));
  }

  public async list(message: Message) {
    const s = await this.db.servers.findOne({ id: message.guild.id });

    let res = 'No active scans';
    if (s) {
      const activeScans = await this.db.getActiveScans(s);
      if (activeScans.length > 0) {
        res = activeScans.map(sc => `${sc.scan.name} (${formatTimestamp(moment(sc.expires))}) #${sc.msg_id}`).join('\n');
      }
    }
    return res;
  }

  // Decrease spawn timer countdown with activity
  // Assign point value to next spawn, size of messages decrease from point value
  public async tick(message: Message) {
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
    const reduce = (length - 8) * config.tick;

    if (this.debouncer.has(id)) {
      const { amount } = this.debouncer.get(id)!;
      this.debouncer.set(id, { amount: amount + reduce });
    }
    else {
      setTimeout(() => {
        this.reduce(server).catch(e => this.handleError(e, server));
      }, config.debounce);
      this.debouncer.set(id, { amount: reduce });
    }
  }

  private setActivity(server: WithId<Server>) {
    const { id } = server;

    const now = moment();

    let activities = this.activity.get(id) ?? [];

    activities = activities.filter(value => now.diff(value.timestamp, 'minutes') <= config.activity_window);

    const amount = (this.debouncer.get(id)?.amount ?? 0);
    activities.push({ timestamp: now, amount });

    this.activity.set(id, activities);
  }

  private async reduce(server: WithId<Server>) {
    this.setActivity(server);

    const { id, send_channel } = server;

    if (this.timers.has(id)) {
      const { endTime } = this.timers.get(id) as Timer;

      const amount = (this.debouncer.get(id)?.amount ?? 0);
      endTime.subtract(amount, 'milliseconds');
      const remaining = endTime.diff(moment(), 'milliseconds');

      let db_msg = `<#${send_channel}>: ${formatTimestamp(moment(endTime).add(amount, 'milliseconds'))} reduced by ${amount / 1000} seconds.\n`;

      if (remaining <= config.debounce) {
        db_msg += 'Remaining time insufficiant, generating now...';
        await this.newSpawn(server);
      }
      else {
        this.setSendTimeout(server, endTime);
        await this.db.servers.updateOne(
          { id },
          { $set: { remaining: endTime.toDate() } }
        );
        db_msg += `Timer set for ${formatTimestamp(endTime)}. ${remaining / 1000} seconds remaining.`;
      }
      debug(this.bot, db_msg);
    }

    this.debouncer.delete(id);
  }

  protected async cleanOldScans(server: WithId<Server>) {
    const { send_channel } = server;

    const activescan_ids = (await this.db.getActiveScans(server))
    .filter(({ expires, scan, msg_id }) => {
      const s = moment(expires).isSameOrAfter(moment().subtract(config.debounce, 'milliseconds'));
      if (!s) {
        debug(this.bot, `${scan.name} expired (${formatTimestamp(moment(expires))})`);
        if (msg_id) {
          (this.bot.channels.get(send_channel) as TextChannel)
          .fetchMessage(msg_id)
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
      return !!s;
    })
    .map(scan => scan._id);

    const res = await this.db.servers.updateOne(
      { id: server.id },
      { $set: { activescan_ids } }
    );
    if (!res.acknowledged) {
      debug(this.bot, 'Unable to save cleaned activescans', 'errors');
    }
  }

  protected async newSpawn(server: WithId<Server>, force = false) {
    const { activescan_ids, send_channel, disabled, id } = server;
    if (disabled) {
      debug(this.bot, `<#${send_channel}>: Scanquest is disabled on this server`);
      return;
    }

    if (!force && activescan_ids.length > 0 && this.last_sent.has(id)) {
      debug(this.bot, `<#${send_channel}>: Recently generated a scan for server`);

      const d = moment().diff(moment(this.last_sent.get(id)), 'minutes');
      if (d < config.safety) {
        this.setSendTimeout(server, moment().add(config.safety, 'minutes'));
        return;
      }
    }

    debug(this.bot, `<#${send_channel}>: Attempting to generate a scan at ${formatTimestamp(moment())}`);

    this.last_sent.set(id, moment());

    let amount = 0;
    if (this.activity.has(id)) {
      this.activity.get(id)!.forEach(v => { amount += v.amount; });
    }

    // TODO can be removed after determining weight
    debug(this.bot, `Amount of value in the previous interval: ${amount}`);

    try {
      const selection = await this.select.card(server, amount);
      // note: this is done after generating a new one so that a recently generated scan doesn't get regenerated
      await this.cleanOldScans(server);
      const remaining = await this.spawnCard(server, selection);
      await this.db.servers.updateOne(
        { id: server.id },
        { $set: { remaining } }
      );
    }
    catch (e) {
      this.handleError(e, server);
    }
  }

  protected expiresToDate(active: number): Date {
    return moment().add(active, 'hours').toDate();
  }

  /**
   * Sends a card image to the configed channel
  */
  protected async spawnCard(server: WithId<Server>, selection: Selection): Promise<Date> {
    const { send_channel } = server;
    const { active, scannable, image } = selection;

    const expires = this.expiresToDate(active);

    return await (this.bot.channels.get(send_channel) as TextChannel)
    .send(new RichEmbed().setDescription('Spawning...'))
    .then(async (message) => {
      debug(this.bot, `<#${send_channel}>: Generated ${scannable.card.name} active until ${formatTimestamp(moment(expires))} at ${formatTimestamp(moment())}`);

      const scanRes = await this.db.scans.insertOne(
        new ActiveScan({ scan: scannable.card, expires, msg_id: message.id })
      );

      if (!scanRes.acknowledged) {
        throw new Error('DB could not create new scan');
      }

      const serverRes = await this.db.servers.updateOne(
        { id: server.id },
        { $push: { activescan_ids: scanRes.insertedId } }
      );

      if (!serverRes.acknowledged) {
        throw new Error('DB could not update server active scans');
      }

      // Update the message to reflect the spawned instance
      await message.edit(image);

      // Min time is to ensure longer spawns don't take too long and no inactive scans for short ones
      const endTime = moment().add(selection.next, 'hours');
      this.setSendTimeout(server, endTime);
      return endTime.toDate();
    })
    .catch((e) => {
      const endTime = moment().add(10, 'minutes');
      this.setSendTimeout(server, endTime);
      debug(this.bot, e, 'errors');
      return endTime.toDate();
    });
  }
}
