import { Client, Message } from 'discord.js';
import { Logger } from 'winston';

import { API } from '../database';
import { SendFunction } from '../definitions';

import { flatten } from '../common';
import parseCommand from '../common/parse_command';
import users from '../common/users';

import ScanQuestDB from './scan_db';
import loadScan from './load';
import listScans from './list';
import Spawner from './spawner';
import Scanner from './scanner';
import Trader from './trader';

const development = (process.env.NODE_ENV === 'development');

export default class ScanQuest {
  private readonly db: ScanQuestDB;
  readonly bot: Client;
  readonly logger: Logger;
  private timeout: NodeJS.Timeout;
  private spawner: Spawner;
  private scanner: Scanner;
  private trader: Trader;
  private init: boolean = false;

  constructor(bot: Client, logger: Logger) {
    this.bot = bot;
    this.logger = logger;
    this.db = new ScanQuestDB();
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
    this.db.start().then(() => {
      this.spawner = new Spawner(this.bot, this.db);
      this.scanner = new Scanner(this.bot, this.db);
      this.trader = new Trader(this.bot, this.db);

      this.logger.info('ScanQuest has started');
      this.init = true;
    }).catch(() => {
      this.logger.info('ScanQuest did not start');
    });
  }

  async stop() {
    clearTimeout(this.timeout);
    this.spawner.stop();
    return this.db.close();
  }

  async monitor(message: Message): Promise<void> {
    if (!this.init || this.bot === undefined || message.author.bot) return;

    // Prevents sending an empty message
    const send: SendFunction = async (msg, options) => {
      if (msg) {
        return message.channel.send(msg, options)
          .catch(error => this.logger.error(error.stack));
      }
    }

    const content = message.content;

    if (!API.data) {
      if (content.charAt(0) === '!') return send('Scanner has not started');
      return;
    }
    else if (API.data === 'local') {
      if (content.charAt(0) === '!') return send('Error with bot database');
      return;
    }

    if (
      (development && content.substring(0, 2) === 'd!') ||
      (!development && (content.charAt(0) === '!' || content.substring(0, 2).toLowerCase() === 'c!'))
    ) {
      const { cmd, args, options } = parseCommand(content);
      switch (cmd) {
        case 'scan':
          if (message.guild) {
            return send(await this.scanner.scan(message.guild.id, message.author.id, flatten(args)));
          }
          return;
        case 'list':
          return listScans(this.db, message, options);
        case 'reroll':
          if (message.author.id === users('daddy') && message.guild) {
            this.spawner.reroll(message);
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
          return;
        case 'perim':
          if (message.guild && message.member.hasPermission('ADMINISTRATOR')) {
            return send(this.db.perim(message.guild.id, args));
          }
      }
    }
    else if (message.guild) {
      this.spawner.tick(message);
    }
  }
}
