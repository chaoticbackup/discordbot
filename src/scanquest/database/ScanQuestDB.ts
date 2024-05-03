import { Snowflake } from 'discord.js';

import { Collection, MongoClient, ObjectId, UpdateResult } from 'mongodb';

import servers from '../../common/servers';
import { AuthFile, Code } from '../../definitions';
import { Scanned } from '../scan_type/Scanned';

import generateCode from './generateCode';

export class Player {
  public id: Snowflake;
  public scans: Scanned[];
  public coins: number;

  constructor(id: Snowflake) {
    this.id = id;
    this.scans = [];
    this.coins = 0;
  }
}

export class ActiveScan {
  public _id: ObjectId;
  public scan: Scanned;
  public expires: Date;
  public msg_id: Snowflake;
  public players: Snowflake[];

  constructor(
    { scan, expires, msg_id }: { scan: Scanned, expires: Date, msg_id: Snowflake }
  ) {
    this.scan = scan;
    this.expires = new Date(expires);
    this.msg_id = msg_id;
    this.players = [];
  }
}

/**
 * This is used for calculating activity "density"
 */
export interface Activity {
  timestamp: Date
  amount: number
}
export class Server {
  public id: Snowflake;
  public send_channel: Snowflake;
  public receive_channel: Snowflake;
  public ignore_channels: Snowflake[];
  public activescan_ids: ObjectId[];
  public remaining: Date | null; // remaining time until next scan
  public activity: Activity[];
  public disabled: boolean;
  public role: Snowflake | undefined;

  constructor(
    { id, send_channel, receive_channel }:
    { id: Snowflake, send_channel: Snowflake, receive_channel: Snowflake }
  ) {
    this.id = id;
    this.send_channel = send_channel;
    this.receive_channel = receive_channel;
    this.ignore_channels = [];
    this.activescan_ids = [];
    this.remaining = null;
    this.activity = [];
    this.disabled = false;
  }
}

class UsedCode {
  public code: Code;
}

class Trade {
  public one: {
    id: Snowflake
    scans: Scanned[]
  };

  public two: {
    id: Snowflake
    scans: Scanned[]
  };
}

const prod = (process.env.NODE_ENV !== 'development');
const init_config = {
  id: prod ? servers('main').id : servers('develop').id,
  send_channel: prod ? servers('main').channel('perim') : servers('develop').channel('bot_commands'),
  receive_channel: prod ? servers('main').channel('bot_commands') : servers('develop').channel('bot_commands')
};

class ScanQuestDB {
  private readonly db_uri?: string;
  private client: MongoClient;
  public players: Collection<Player>;
  public servers: Collection<Server>;
  public usedcodes: Collection<UsedCode>;
  public trades: Collection<Trade>;
  public scans: Collection<ActiveScan>;

  public constructor(auth: AuthFile) {
    this.db_uri = auth?.db_uri;
  }

  public async start(): Promise<void> {
    if (!this.db_uri) return await Promise.reject('db_uri not configured');

    const client = new MongoClient(this.db_uri);

    try {
      await client.connect();
      await client.db('scanquest').command({ ping: 1 });
    } catch (e) {
      return await Promise.reject(e);
    }

    this.client = client;
    const db = client.db('scanquest');

    const collections = (await db.listCollections().toArray());
    const collectionNames = collections.map(c => c.name);

    if (!collectionNames.includes('servers')) {
      await db.createCollection('servers');
      this.servers = db.collection('servers');
      await this.servers.insertOne(new Server(init_config));
    } else {
      this.servers = db.collection('servers');
      if (this.servers.findOne({ id: init_config.id }) === null) {
        await this.servers.insertOne(new Server(init_config));
      }
    }
    this.servers.createIndex({ id: 1 }, { unique: true }).finally(() => {});

    this.players = db.collection('players');
    this.players.createIndex({ id: 1 }, { unique: true }).finally(() => {});

    this.scans = db.collection('scans');

    this.usedcodes = db.collection('usedcodes');

    this.trades = db.collection('trades');
  }

  public async close(): Promise<void> {
    return await this.client.close();
  }

  public async save(player: Player, card: Scanned): Promise<UpdateResult>;
  public async save(member_id: Snowflake, card: Scanned): Promise<UpdateResult>;
  public async save(arg1: Player | Snowflake, card: Scanned): Promise<UpdateResult> {
    const player = (typeof arg1 === 'string') ? await this.findOnePlayer({ id: arg1 }) : arg1;

    if (!player) {
      return {
        acknowledged: false,
        matchedCount: 0,
        modifiedCount: 0,
        upsertedCount: 0,
        upsertedId: new ObjectId()
      };
    }

    const scans = player.scans ?? [];
    scans.push(card);

    return await this.players.updateOne(
      { id: player.id },
      {
        $set: { scans }
      },
      { upsert: true }
    );
  }

  public is_send_channel = async (server_id: Snowflake, channel_id: Snowflake) => {
    const server = await this.servers.findOne({ id: server_id });
    if (server === null) return false;
    return (server.send_channel === channel_id);
  };

  public is_receive_channel = async (server_id: Snowflake, channel_id: Snowflake) => {
    const server = await this.servers.findOne({ id: server_id });
    if (server === null) return false;
    return (server.receive_channel === channel_id);
  };

  public findOnePlayer = async ({ id: player_id }: { id: Snowflake }): Promise<Player> => {
    const player = await this.players.findOne({ id: player_id });
    if (player !== null) {
      return player;
    }

    const p = new Player(player_id);
    const res = await this.players.insertOne(p);
    if (res.acknowledged) {
      return p;
    }
    else {
      throw new Error('Unable to create player');
    }
  };

  public getActiveScans = async ({ activescan_ids }: Pick<Server, 'activescan_ids'>) => {
    return await this.scans.find({
      _id: { $in: activescan_ids }
    }).toArray();
  };

  public async generateCode() {
    return await generateCode(this);
  }
}

export default ScanQuestDB;
