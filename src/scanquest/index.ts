import { Client, Message } from 'discord.js';
import { Logger } from 'winston';

import { API } from '../database';
import { SendFunction } from '../definitions';

import Icons from '../common/bot_icons';
import parseCommand from '../common/parse_command';
import users from '../common/users';

import { ScanBattlegear, ScanCreature, ScanLocation } from './scanfunction';

import ScanQuestDB from './scan_db';
import loadScan from './load';
import listScans from './list';

const development = (process.env.NODE_ENV === 'development');

export default class ScanQuest {
  private readonly db: ScanQuestDB;
  private timeout: NodeJS.Timeout;
  private scan_creature: ScanCreature;
  private scan_locations: ScanLocation;
  private scan_battlegear: ScanBattlegear;
  bot: Client;
  logger: Logger;
  icons: Icons;

  constructor(bot: Client, logger: Logger) {
    this.db = new ScanQuestDB();
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

    // Initialize components
    this.icons = new Icons(this.bot);
    this.scan_creature = new ScanCreature();
    this.scan_locations = new ScanLocation();
    this.scan_battlegear = new ScanBattlegear();

    this.logger.info('ScanQuest has started on channel');
  }

  stop() {
    // TODO save all data into database
    clearTimeout(this.timeout);
  }

  async monitor(message: Message): Promise<void> {
    if (this.bot === undefined || message.author.bot) return;

    // TODO only monitor the server the bot is configured for

    // TODO decrease timer countdown with activity

    // Prevents sending an empty message
    const send: SendFunction = async (msg, options) => {
      if (msg) {
        return message.channel.send(msg, options)
          .catch(error => this.logger.error(error.stack));
      }
      return Promise.resolve();
    }

    const content = message.content;

    if (!API.data) {
      if (content.charAt(0) === '!') return send('Scanquest has not started');
      return Promise.resolve();
    }

    if (
      (development && content.substring(0, 2) === 'd!') ||
      (content.charAt(0) === '!' || content.substring(0, 2).toLowerCase() === 'c!')
    ) {
      const { cmd, args, options } = parseCommand(content);
      switch (cmd) {
        case 'scan':
          if (message.guild) {
            // return send(await scan(this.db, message.guild.id, message.author.id, this.icons));
          }
          return;
        case 'list':
          return listScans(this.db, message, options);
        case 'reroll':
          if (message.author.id === users('daddy')) {
            // clearTimeout(this.timeout);
            // spawn();
          }
          return;
        case 'load':
          if (message.author.id === users('daddy')) {
            const id = args[0];
            const type = args[1];
            const content = args.splice(1).join(' ');
            const info = content.substr(content.indexOf(' ') + 1);

            return this.db.save(id, (loadScan({ type, info }))!.card);
          }
      }
    }
    else {
      // TODO only monitor the server the bot is configured for

      // TODO decrease timer countdown with activity
      // Assign point value to next spawn, size of messages decrease from point value
      return Promise.resolve();
    }
  }
}
