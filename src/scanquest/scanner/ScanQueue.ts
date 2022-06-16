import { Client, Message, Snowflake } from 'discord.js';

import { SendFunction } from '../../definitions';
import ScanQuestDB, { Player } from '../database';

import Scanner from './Scanner';

type PlayerQueue = Map<Snowflake, Array<{
  guild_id: Snowflake
  args: string
  send: SendFunction
  skon: boolean
}>>;

/**
 * This acts as a wrapper for the scanner that queues up requests in response to people spamming
 */
export default class ScanQueue {
  readonly db: ScanQuestDB;
  protected scanner: Scanner;
  protected queue: PlayerQueue;

  constructor(bot: Client, db: ScanQuestDB) {
    this.db = db;
    this.scanner = new Scanner(bot, db);
    this.queue = new Map();
  }

  scan = async (message: Message, args: string, send: SendFunction, skon: boolean): Promise<void> => {
    const guild_id = message.guild.id;
    const author_id = message.author.id;

    const server = await this.db.servers.findOne({ id: guild_id });
    if (server === null) return;

    if (server.activescans.length === 0) {
      await send('There is no scannable card');
      return;
    }

    if (this.queue.has(author_id)) {
      this.queue.get(author_id)!.push({ guild_id, args, send, skon });
    } else {
      this.queue.set(author_id, []);
      const player = await this.db.findOnePlayer({ id: author_id });
      this.queue.get(author_id)!.push({ guild_id, args, send, skon });
      void this.enqueue(player, true);
    }
  };

  enqueue = async (player: Player, first = false): Promise<void> => {
    if (!first) await new Promise(resolve => setTimeout(resolve, 200));

    if (!this.queue.has(player.id)) return;

    if (this.queue.get(player.id)?.length === 0) {
      this.queue.delete(player.id);
      return;
    }

    const { guild_id, args, send, skon } = this.queue.get(player.id)!.shift()!;

    const m = await this.scanner.scan(player, guild_id, args, send);
    if (m && skon) await m.react('728825180763324447');

    await this.enqueue(player);
  };
}
