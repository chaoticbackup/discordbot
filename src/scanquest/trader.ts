import { Client } from 'discord.js';
import ScanQuestDB from './scan_db';

export default class Trader {
  readonly bot: Client;
  readonly db: ScanQuestDB;

  constructor(bot: Client, db: ScanQuestDB) {
    this.bot = bot;
    this.db = db;
  }

  trade() {
    // TODO
  }
}
