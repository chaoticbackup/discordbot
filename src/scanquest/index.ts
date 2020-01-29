import { Client, DMChannel, Message, RichEmbed } from 'discord.js';
import fs from 'fs-extra';
import { Logger } from 'winston';
import Icons from '../common/bot_icons';
import servers from '../common/servers';
import { API } from '../database';
import { Channel, SendFunction } from '../definitions';
import ScanBattlegear from './scanfunction/Battlegear';
import ScanCreature from './scanfunction/Creature';
import ScanLocation from './scanfunction/Location';
import { BattlegearScan, ScannableBattlegear } from './scannable/Battlegear';
import { CreatureScan, ScannableCreature } from './scannable/Creature';
import { LocationScan, ScannableLocation } from './scannable/Location';
import { Scannable } from './scannable/Scannable';
import ScanQuestDB from './scan_db';
import users from '../common/users';

const config = {
  send_channel: servers('main').channel('perim'),
  recieve_channel: servers('main').channel('bot_commands'),
  test_channel: servers('develop').channel('bot_commands')
}

const file = 'last_spawn.json';

export default class ScanQuest {
  private readonly db: ScanQuestDB;
  private readonly send_channel: string;
  private readonly recieve_channel: string;
  private timeout: NodeJS.Timeout;
  private scan_creature: ScanCreature;
  private scan_locations: ScanLocation;
  private scan_battlegear: ScanBattlegear;
  private lastScan: Scannable | null;
  bot: Client;
  logger: Logger;
  icons: Icons;

  constructor(bot: Client, logger: Logger) {
    this.db = new ScanQuestDB();
    this.send_channel = (process.env.NODE_ENV !== 'development') ? config.send_channel : config.test_channel;
    this.recieve_channel = (process.env.NODE_ENV !== 'development') ? config.recieve_channel : config.test_channel;
    this.bot = bot;
    this.logger = logger;
  }

  start() {
    // Check to see if database has been initialized
    if (!API.data) {
      // Try again in a second
      this.timeout = setTimeout(() => { this.start() }, 1000);
      return;
    }
    if (API.data === 'local') {
      this.logger.info('ScanQuest cannot start. Database is down');
      return;
    }

    // load previous card spawn
    if (fs.existsSync(file)) {
      fs.readFile(file, (err, data) => {
        if (!err) {
          this.lastScan = this.loadScan(JSON.parse(data.toString()));
        }
      });
    }

    // Initialize components
    this.icons = new Icons(this.bot);
    this.scan_creature = new ScanCreature();
    this.scan_locations = new ScanLocation();
    this.scan_battlegear = new ScanBattlegear();

    this.logger.info(`ScanQuest has started on channel <#${this.send_channel}>`);

    if (process.env.NODE_ENV === 'development') {
      this.randomTime(0.01, 0.3);
    }
    else {
      this.randomTime(120, 240);
    }
  }

  stop() {
    // save all data into database
    clearTimeout(this.timeout);
  }

  async monitor(message: Message): Promise<void> {
    if (this.bot === undefined || message.author.bot) return;

    // TODO only monitor the server the bot is configured for

    // TODO decrease timer countdown with activity

    // Prevents sending an empty message
    const send: SendFunction = async (msg, options) => {
      if (msg) { return message.channel.send(msg, options)
      .catch(error => this.logger.error(error.stack)); }
      return Promise.resolve();
    }

    if (!API.data) return send('Scanquest has not started');

    let result: string | undefined;

    if (message.content.charAt(1) === '!') {
      result = message.content.substring(2);
    }
    else if (message.content.charAt(0) === '!') {
      result = message.content.substring(1);
    }

    if (result !== undefined) {
      const cmd = result.split(' ')[0].toLowerCase();

      /* Scan */
      switch (cmd) {
        case 'scan':
          if (message.guild) {
            // return send(await scan(this.db, message.guild.id, message.author.id, this.icons));
          }
          return;
        case 'list':
          // return list(this.db, message, options);
          return;
        case 'reroll':
          if (message.author.id === users('daddy')) {
            clearTimeout(this.timeout);
            this.sendCard();
          }
          return;
        case 'load':
          if (message.author.id === users('daddy')) {
            const args: string[] = result.split(' ').splice(1);
            const id = args[0];
            const type = args[1];
            const content = args.splice(1).join(' ');
            const info = content.substr(content.indexOf(' ') + 1);

            return this.db.save(id, (this.loadScan({ type, info }))!.card);
          }
      }
    }
    else {
      // TODO only monitor the server the bot is configured for

      // TODO decrease timer countdown with activity
      // Assign point value to next spawn, size of messages decrease from point value
    }
  }

  private loadScan(lastSpawn: {type: string, info: any}): Scannable | null {
    if (lastSpawn.type === 'Creatures') {
      const crScan = new CreatureScan();
      [
        crScan.name, crScan.courage, crScan.power,
        crScan.wisdom, crScan.speed, crScan.energy
      ] = lastSpawn.info.split(/ (?=[0-9]+)/);
      return new ScannableCreature(crScan);
    }
    else if (lastSpawn.type === 'Battlegear') {
      const bgScan = new BattlegearScan();
      bgScan.name = lastSpawn.info;
      return new ScannableBattlegear(bgScan);
    }
    else if (lastSpawn.type === 'Locations') {
      const locScan = new LocationScan();
      locScan.name = lastSpawn.info;
      return new ScannableLocation(locScan);
    }

    return null; // This shouldn't be null unless error in json file
  }

  /**
     * Takes a min and max number in minutes and
     * sets the next iterval to send a creature
     */
  private randomTime(min: number, max: number): void {
    const interval = Math.floor(((Math.random() * (max - min)) + min) * 60) * 1000;
    this.timeout = setTimeout(() => { this.sendCard() }, interval);
  }

  /**
     * Sends a card image to the configed channel
     */
  private sendCard() {
    let lastScan: Scannable;
    let image: RichEmbed;

    // Creatures spawn more often than locations and battlegear
    const rnd = Math.floor(Math.random() * 20);
    if (rnd < 4) {
      [lastScan, image] = this.scan_locations.generate();
    }
    else if (rnd < 5) {
      [lastScan, image] = this.scan_battlegear.generate();
    }
    else {
      [lastScan, image] = this.scan_creature.generate();
    }

    (this.bot.channels.get(this.send_channel) as Channel).send(image).catch(() => {});

    const lastSpawn = JSON.stringify({
      type: lastScan.card.type,
      info: lastScan.toString()
    });

    fs.writeFile(file, lastSpawn).catch(() => {});
  }
}
