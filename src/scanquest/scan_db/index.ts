import { Snowflake } from 'discord.js';
import Loki, { Collection } from 'lokijs';
import path from 'path';
import logger from '../../logger';
import servers from '../../common/servers';
import db_path from '../../database/db_path';
import Scanned from '../scanner/Scanned';
import { Code } from '../../definitions';
import perim from './config';
import generateCode from './generateCode';
const LokiFSStructuredAdapter = require('lokijs/src/loki-fs-structured-adapter');

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

interface activescan { scan: Scanned, expires: Date }

export class ActiveScan {
  public scan: Scanned;
  public expires: Date;
  public players: Snowflake[];

  constructor({ scan, expires }: activescan) {
    this.scan = scan;
    this.expires = new Date(expires);
    this.players = [];
  }
}

interface server {id: Snowflake, send_channel: Snowflake, receive_channel: Snowflake}

export class Server {
  public id: Snowflake;
  public send_channel: Snowflake;
  public receive_channel: Snowflake;
  public ignore_channels: Snowflake[];
  public activescans: ActiveScan[];
  public remaining: Date | null; // remaining time until next scan

  constructor(
    { id, send_channel, receive_channel }: server
  ) {
    this.id = id;
    this.send_channel = send_channel;
    this.receive_channel = receive_channel;
    this.ignore_channels = [];
    this.activescans = [];
    this.remaining = null;
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
  private db: Loki;
  public players: Collection<Player>;
  public servers: Collection<Server>;
  public usedcodes: Collection<UsedCode>;
  public trades: Collection<Trade>;

  public async start(): Promise<void> {
    return await new Promise((resolve) => {
      this.db = new Loki(path.resolve(db_path, 'scanquest.db'), {
        adapter: new LokiFSStructuredAdapter(),
        autoload: true,
        autosave: true,
        throttledSaves: false,
        autoloadCallback: () => {
          const players = this.db.getCollection('players') as Collection<Player>;
          if (players === null) {
            this.players = this.db.addCollection('players');
          }
          else {
            this.players = players;
          }

          const usedcodes = this.db.getCollection('usedcodes') as Collection<UsedCode>;
          if (usedcodes === null) {
            this.usedcodes = this.db.addCollection('usedcodes');
          }
          else {
            this.usedcodes = usedcodes;
          }

          const servers = this.db.getCollection('servers') as Collection<Server>;
          if (servers === null) {
            this.servers = this.db.addCollection('servers');
            this.servers.insertOne(new Server(init_config));
          }
          else {
            this.servers = servers;
            if (this.servers.findOne({ id: init_config.id }) === null) {
              this.servers.insertOne(new Server(init_config));
            }
          }

          const trades = this.db.getCollection('trades') as Collection<Trade>;
          if (trades === null) {
            this.trades = this.db.addCollection('trades');
          }
          else {
            this.trades = trades;
          }

          return resolve();
        }
      });
    });
  }

  public async close(): Promise<void> {
    return await new Promise((resolve) => {
      this.db.saveDatabase((err) => {
        if (err) {
          logger.error(`save error : ${err}`);
        }
        this.db.close((err) => {
          if (err) {
            logger.error(`close error : ${err}`);
          }
          resolve();
        });
      });
    });
  }

  public async save(player: Player, card: Scanned): Promise<void>;
  public async save(member_id: Snowflake, card: Scanned): Promise<void>;
  public async save(arg1: Player | Snowflake, card: Scanned): Promise<void> {
    const player: Player = (typeof arg1 === 'string') ? this.findOnePlayer({ id: arg1 }) : arg1;

    player.scans.push(card);
    this.players.update(player);
    return await Promise.resolve();
  }

  public is_send_channel = (server_id: Snowflake, channel_id: Snowflake): boolean => {
    const server = this.servers.findOne({ id: server_id });
    if (server === null) return false;
    return (server.send_channel === channel_id);
  };

  public is_receive_channel = (server_id: Snowflake, channel_id: Snowflake): boolean => {
    const server = this.servers.findOne({ id: server_id });
    if (server === null) return false;
    return (server.receive_channel === channel_id);
  };

  public findOnePlayer = ({ id: player_id }: {id: Snowflake}) => {
    const player = this.players.findOne({ id: player_id });
    if (player === null) {
      return this.players.insertOne(new Player(player_id)) as Player & LokiObj;
    }
    return player;
  };

  public generateCode() {
    return generateCode(this);
  }

  public perim(id: Snowflake, args: string[]) {
    return perim(this, id, args);
  }
}

export default ScanQuestDB;
