
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
  private readonly scan_battlegear: Battlegear;
  private readonly scan_creature: Creature;
  private readonly scan_locations: Location;
  private timers: Record<Snowflake, Timer> = {};
  private debouncer: Record<Snowflake, Amount | null> = {};
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
    this.db.servers.find({}).forEach((server) => {
      if (server.remaining && server.remaining > 0) {
        const timeout = setTimeout(() => this.sendCard(server), server.remaining);
        this.timers[server.id] = { timeout, duration: server.remaining };
      }
      // TODO consider server without timeout
    });
  }

  stop() {
    // write timers to database
    Object.keys(this.timers).forEach((server_id) => {
      clearTimeout(this.timers[server_id].timeout);
      this.db.servers.findAndUpdate({ id: server_id }, (server) => {
        server.remaining = this.timers[server_id].duration;
      });
      // TODO figure out why timers aren't being written
    });
  }

  reroll(message: Message) {
    const id = message.guild.id;
    const server = this.db.servers.findOne({ id });
    if (server) {
      if (this.timers[id]) {
        const { timeout } = this.timers[id];
        clearTimeout(timeout);
      }
      this.sendCard(server);
    }
  }

  // Decrease spawn timer countdown with activity
  // Assign point value to next spawn, size of messages decrease from point value
  tick(message: Message) {
    const id = message.guild.id;
    // only monitor the servers the bot is configured for
    const server = this.db.servers.findOne({ id });
    if (!server) return;

    // Ignore short messages
    if (message.content.length < 25) return;

    // reduces timer by 1 second per character in messaage
    const reduce = message.content.length * 1000;

    if (this.debouncer[id] && this.debouncer[id] !== null) {
      this.debouncer[id]!.amount += reduce;
    }
    else {
      setTimeout(() => this.reduce(server), 4 * 60 * 1000);
      this.debouncer[id] = { amount: reduce };
    }
  }

  reduce(server: Server) {
    const { id } = server;
    if (this.timers[id]) {
      let { timeout, duration } = this.timers[id];
      const amount = this.debouncer[id]?.amount ?? 0;
      clearTimeout(timeout);

      duration = duration - amount;

      timeout = setTimeout(() => this.sendCard(server), duration)
      this.timers[id] = { timeout, duration };
    }

    this.debouncer[id] = null;
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
    image.setDescription(`Scan expires in ${active} hours`);

    // add to list of active scans
    server.activescans.push(new ActiveScan({ scan: scannable.card, expires }));

    // cleanup old scans
    // give or take a minute
    const now = new Date();
    now.setMinutes(now.getMinutes() - 1);

    server.activescans = server.activescans.filter(scan => {
      return (scan.expires > now);
    });
    this.db.servers.update(server);

    // Set new spawn timer 7 Hours
    const duration = 7 * 60 * 60 * 1000;

    (this.bot.channels.get(send_channel) as Channel).send(image).catch(() => {});

    const timeout = setTimeout(() => this.sendCard(server), duration);
    this.timers[send_channel] = { timeout, duration };
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
