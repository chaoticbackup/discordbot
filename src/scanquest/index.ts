import { Client, Message } from 'discord.js';

import { API } from '../database';
import { SendFunction } from '../definitions';

import { flatten } from '../common';
import parseCommand from '../common/parse_command';
import users from '../common/users';
import logger from '../logger';

import ScanQuestDB from './scan_db';
import loadScan from './load';
import { listScans, balance } from './player';
import Spawner from './spawner';
import Scanner from './scanner';
import Trader from './trader';
import perim from './scan_db/config';

const development = (process.env.NODE_ENV === 'development');

export default class ScanQuest {
  private readonly db: ScanQuestDB;
  readonly bot: Client;
  private timeout: NodeJS.Timeout;
  private spawner: Spawner;
  private scanner: Scanner;
  private trader: Trader;
  private init: boolean = false;

  constructor(bot: Client) {
    this.bot = bot;
    this.db = new ScanQuestDB();
  }

  start() {
    // Check to see if database has been initialized
    if (!API.data) {
      // Try again in a second
      this.timeout = setTimeout(() => { this.start(); }, 1000);
      return;
    }
    if (API.data === 'local') {
      logger.info('ScanQuest cannot start. Database is down');
      return;
    }

    // Initialize components
    this.db.start().then(() => {
      this.spawner = new Spawner(this.bot, this.db);
      this.scanner = new Scanner(this.bot, this.db);
      this.trader = new Trader(this.bot, this.db);

      logger.info('ScanQuest has started');
      this.init = true;
    }).catch(() => {
      logger.info('ScanQuest did not start');
    });
  }

  async stop() {
    clearTimeout(this.timeout);
    this.spawner.stop();
    return await this.db.close();
  }

  async monitor(message: Message): Promise<void> {
    if (!this.init || this.bot === undefined || message.author.bot) return;

    // Prevents sending an empty message
    const send: SendFunction = async (msg, options) => {
      if (msg || options) {
        return await message.channel.send(msg, options)
          .catch(error => { logger.error(error.stack); });
      }
    };

    const content = message.content;
    const mentions: string[] = Array.from(message.mentions.users.keys());

    if (!API.data) {
      if (content.charAt(0) === '!') await send('Scanner has not started');
      return;
    }
    else if (API.data === 'local') {
      if (content.charAt(0) === '!') await send('Error with bot database');
      return;
    }

    if (
      (development && content.substring(0, 2) === 'd!') ||
      (!development && (content.charAt(0) === '!' || content.substring(0, 2).toLowerCase() === 'c!'))
    ) {
      const { cmd, args, options } = parseCommand(content);
      switch (cmd) {
        case 'scan':
          if (message.guild && this.db.is_receive_channel(message.guild.id, message.channel.id)) {
            await send(await this.scanner.scan(message.guild.id, message.author.id, flatten(args)));
          }
          return;
        case 'list':
        case 'scans':
          return await listScans(this.db, message, options, send);
        case 'balance':
        case 'coins':
          await balance(this.db, message, options, send);
          return;
        case 'reroll':
          if (message.guild && message.member.hasPermission('ADMINISTRATOR')) {
            this.spawner.reroll(message);
          }
          return;
        case 'load':
          if (message.author.id === users('daddy') || message.author.id === users('bf')) {
            const id = args[0];
            const type = args[1];
            const content = args.splice(1).join(' ');
            const info = content.substr(content.indexOf(' ') + 1);
            const scan = loadScan({ type, info });
            if (scan) return await this.db.save(id, scan.card);
            return await send('Invalid format');
          }
          return;
        case 'trade':
          if (message.guild) {
            await this.trader.trade(args, mentions, message);
          }
          return;
        case 'spawn':
          if (message.guild && message.member.hasPermission('ADMINISTRATOR')) {
            this.spawner.spawn(message, args, options);
          }
          return;
        case 'perim':
          return await perim(this.db, message, args, mentions, send);
      }
    }
    else if (message.guild) {
      this.spawner.tick(message);
    }
  }
}
