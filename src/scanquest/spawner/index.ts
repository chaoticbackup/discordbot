
import { Client, RichEmbed, Snowflake, Message } from 'discord.js';
import Battlegear from './Battlegear';
import Creature from './Creature';
import Location from './Location';
import Scannable from '../scanner/Scannable';
import ScanQuestDB, { Server, ActiveScan } from '../scan_db';
import { Channel, Card } from '../../definitions';
import { API } from '../../database';

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

export default class Spawner {
  private readonly timers: Map<Snowflake, Timer> = new Map();
  private readonly debouncer: Map<Snowflake, Amount> = new Map();
  private readonly scan_battlegear: Battlegear;
  private readonly scan_creature: Creature;
  private readonly scan_locations: Location;
  readonly bot: Client;
  readonly db: ScanQuestDB;

  constructor(bot: Client, db: ScanQuestDB) {
    this.bot = bot;
    this.db = db;
    this.scan_battlegear = new Battlegear();
    this.scan_creature = new Creature();
    this.scan_locations = new Location();
    this.start();
  }

  start() {
    // get timers from database
    this.db.servers.data.forEach((server) => {
      if (server.remaining && server.remaining > 0) {
        const timeout = setTimeout(() => this.sendCard(server), server.remaining);
        this.timers.set(server.id, { timeout, duration: server.remaining });
      }
    });
  }

  stop() {
    // write timers to database
    this.timers.forEach((value, key) => {
      clearTimeout(value.timeout);
      let { duration } = value;
      duration -= this.debouncer.get(key)?.amount ?? 0;
      this.db.servers.findAndUpdate({ id: key }, (server) => {
        server.remaining = duration;
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
    if (!server) return;

    // Ignore short messages
    const content = message.content.replace(/<:.*:[0-9]*>/gi, '');
    const words = content.split(' ').length;
    if (words < 3 || content.length < 20) return;

    // reduces timer by 1 second per character in messaage
    const reduce = (content.length) * 1000;

    if (this.debouncer.has(id)) {
      const { amount } = this.debouncer.get(id) as Amount;
      this.debouncer.set(id, { amount: amount + reduce });
    }
    else {
      setTimeout(() => this.reduce(server), 2 * 60 * 1000);
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

      // less than 5 seconds remaining
      if (duration <= 5000) {
        this.sendCard(server);
      }
      else {
        timeout = setTimeout(() => this.sendCard(server), duration);
        this.timers.set(id, { timeout, duration });
      }
    }

    this.debouncer.delete(id);
  }

  /**
   * Sends a card image to the configed channel
  */
  private sendCard(server: Server) {
    const { send_channel } = server;
    const [scannable, image] = this.selectCard(server);

    const card = API.find_cards_by_name(scannable.card.name)[0] as Card;

    const active = (() => {
      switch (card.gsx$rarity.toLowerCase()) {
        case 'ultra rare': return 8;
        case 'super rare': return 7;
        case 'rare': return 6;
        case 'uncommon': return 5;
        case 'common': return 4;
        default: return 4;
      }
    })();

    // set time active
    const expires = new Date();
    expires.setHours(expires.getHours() + active);
    image.setTitle(`Scan expires in ${active} hours`);

    // cleanup old scans
    // give or take a minute
    const now = new Date();
    now.setMinutes(now.getMinutes() - 1);

    server.activescans = server.activescans.filter(scan => {
      return (new Date(scan.expires) >= now);
    });
    // add to list of active scans
    server.activescans.push(new ActiveScan({ scan: scannable.card, expires }));

    // Set new spawn timer 7 Hours
    const duration = 7 * 60 * 60 * 1000;

    server.remaining = duration;

    this.db.servers.update(server);

    (this.bot.channels.get(send_channel) as Channel).send(image).catch(() => {});

    const timeout = setTimeout(() => this.sendCard(server), duration);
    this.timers.set(send_channel, { timeout, duration });
  }

  // Creatures spawn more often than locations and battlegear
  // TODO more complex spawn logic
  private selectCard(server: Server): [Scannable, RichEmbed] {
    let scannable: Scannable;
    let image: RichEmbed;

    const rnd = Math.floor(Math.random() * 20);
    if (rnd < 4) {
      [scannable, image] = this.scan_locations.generate();
    }
    else if (rnd < 5) {
      [scannable, image] = this.scan_battlegear.generate();
    }
    else {
      [scannable, image] = this.scan_creature.generate();
    }

    // Don't resend existing scan
    if (server.activescans.find(scan => scan.scan.name === scannable.card.name)) {
      return this.selectCard(server);
    }

    return [scannable, image];
  }
}
