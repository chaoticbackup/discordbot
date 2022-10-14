import { Client, Message } from 'discord.js';

import { flatten, msgCatch } from '../common';
import debug from '../common/debug';
import parseCommand from '../common/parseCommand';
import { isUser } from '../common/users';

import { API } from '../database';
import { AuthFile, SendFunction } from '../definitions';
import logger from '../logger';

import perim from './config';
import ScanQuestDB from './database';
import loadScan from './loader/Loader';
import { balance, listScans, rate } from './player';
import Scanner from './scanner/ScanQueue';
import Spawner from './spawner/Spawner';
import Trader from './trader/Trader';

const development = (process.env.NODE_ENV === 'development');

export default class ScanQuest {
  readonly bot: Client;
  private timeout: NodeJS.Timeout;
  private init: boolean = false;
  protected readonly db: ScanQuestDB;
  protected spawner: Spawner;
  protected scanner: Scanner;
  protected trader: Trader;

  constructor(bot: Client, auth: AuthFile) {
    this.bot = bot;
    this.db = new ScanQuestDB(auth);
  }

  start() {
    clearTimeout(this.timeout);
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
    this.db.start().then(async () => {
      this.spawner = new Spawner(this.bot, this.db);
      this.scanner = new Scanner(this.bot, this.db);
      // this.trader = new Trader(this.bot, this.db);

      await this.spawner.start();
      logger.info('ScanQuest has started');
      this.init = true;
    }).catch((e) => {
      logger.error(e);
      logger.error('ScanQuest did not start');
    });
  }

  async stop() {
    await this.spawner.stop();
    return await this.db.close();
  }

  async monitor(message: Message): Promise<void> {
    if (!this.init || this.bot === undefined || message.author.bot) return;

    // Prevents sending an empty message
    const send: SendFunction = async (msg, options) => {
      if (msg || options) {
        return await message.channel.send(msg, options).catch(msgCatch);
      }
    };

    const { content } = message;
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
        case 'skon':
        case 'scan':
          if (message.guild && await this.db.is_receive_channel(message.guild.id, message.channel.id)) {
            await this.scanner.scan(message, flatten(args), send, cmd === 'skon');
          }
          return;
        case 'list':
        case 'scans':
        case 'skons':
          await listScans(this.db, message, args.join(' '), options, send);
          return;
        case 'rate':
          await send(rate(this.db, message, args, options, this.bot));
          return;
        case 'balance':
        case 'coins':
          await balance(this.db, message, options, send);
          return;
        case 'trade':
          if (message.guild) {
            // await this.trader.trade(args, mentions, message); TODO
          }
          return;

        /* Admin functions */
        case 'load':
          if (isUser(message, ['daddy', 'bf'])) {
            await send(await loadScan(this.db, args));
          }
          return;
        case 'spawn':
          if (message.guild && isUser(message, ['daddy', 'bf'])) {
            await this.spawner.spawn(message, args, options);
          }
          return;
        case 'scanlist':
          if (message.guild) {
            await send(await this.spawner.list(message));
          }
          return;
        case 'perim':
          await perim.call(this, message, args, mentions, send);
      }
    }
    else if (message.guild) {
      this.spawner.tick(message).catch((e) => { debug(this.bot, e); });
    }
  }
}
