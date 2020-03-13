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
import parseCommand from '../common/parse_command';

const config = {
  send_channel: servers('main').channel('perim'),
  recieve_channel: servers('main').channel('bot_commands'),
  test_channel: servers('develop').channel('bot_commands')
}

const development = (process.env.NODE_ENV === 'development');

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
    clearTimeout(this.timeout);
  }

  async monitor(message: Message): Promise<void> {
    if (this.bot === undefined || message.author.bot) return;

    // TODO only monitor the server the bot is configured for

    // TODO decrease timer countdown with activity

    // Prevents sending an empty message
    const send: SendFunction = async (msg, options) => {
      if (msg) return message.channel.send(msg, options).catch(error => this.logger.error(error.stack));
    }

    if (!API.data) return send('Scanquest has not started');

    const content = message.content;

    if (
      (development && content.substring(0, 2) === 'd!') ||
      (!development && (content.charAt(0) === '!' || content.substring(0, 2).toLowerCase() === 'c!'))
    ) {
      const { cmd, args, options } = parseCommand(content);

      /* Scan */
      switch (cmd) {
        case 'scan':
          if (message.channel.id === this.recieve_channel) {
            return this.scan(message.author.id, send);
          }
          return;
        case 'list':
          if (message.channel.id === this.recieve_channel || message.channel instanceof DMChannel) {
            return this.db.list(message).then(send);
          }
          return;
        case 'reroll':
          if (message.author.id === users('daddy') && message.guild) {
            clearTimeout(this.timeout);
            this.sendCard();
          }
          return;
        case 'load':
          if (message.author.id === users('daddy')) {
            const id = args[0];
            const type = args[1];
            const content = args.splice(1).join(' ');
            const info = content.substr(content.indexOf(' ') + 1);

            this.db.save(id, (this.loadScan({ type, info }))!.card).catch(() => {});
          }
      }
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

  private async scan(id: string, send: SendFunction): Promise<void> {
    const lastScan = this.lastScan;
    if (!lastScan) {
      return send('There is no scannable card');
    }

    if (await this.db.save(id, lastScan.card)) {
      return send(lastScan.getCard(this.icons));
    }

    return send(`You've already scanned this ${lastScan.card.name}`);
  }

  /**
     * Takes a min and max number in minutes and
     * sets the next iterval to send a creature
     */
  private randomTime(min: number, max: number): void {
    clearTimeout(this.timeout);
    const interval = Math.floor(((Math.random() * (max - min)) + min) * 60) * 1000;
    this.timeout = setTimeout(() => { this.sendCard() }, interval);
  }

  /**
     * Sends a card image to the configed channel
     */
  private sendCard() {
    let image: RichEmbed;

    // Creatures spawn more often than locations and battlegear
    const rnd = Math.floor(Math.random() * 20);
    if (rnd < 4) {
      [this.lastScan, image] = this.scan_locations.generate();
    }
    else if (rnd < 5) {
      [this.lastScan, image] = this.scan_battlegear.generate();
    }
    else {
      [this.lastScan, image] = this.scan_creature.generate();
    }

    (this.bot.channels.get(this.send_channel) as Channel).send(image).catch(() => {});

    this.randomTime(300, 400);

    const lastSpawn = JSON.stringify({
      type: this.lastScan.card.type,
      info: this.lastScan.toString()
    });

    fs.writeFile(file, lastSpawn).catch(() => {});
  }
}
