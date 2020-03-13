import { Snowflake } from 'discord.js';
import Loki, { Collection } from 'lokijs';
import path from 'path';
import servers from '../common/servers';
import db_path from '../database/db_path';
import Scan from './scanner/Scan';
import { Code } from './scanner/Code';
import Scannable from './scanner/Scannable';
const LokiFSStructuredAdapter = require('lokijs/src/loki-fs-structured-adapter');

export class Player {
  public id: string;
  public scans: Scan[];
}

interface activescan { scannable: Scannable, expires: Date }

export class ActiveScan {
  public scannable: Scannable;
  public expires: Date;

  constructor({ scannable, expires }: activescan) {
    this.scannable = scannable;
    this.expires = expires;
  }

  get name() {
    return this.scannable.card.name;
  }
}

interface server {id: string, send_channel: string, receive_channel: string}

export class Server {
  public id: Snowflake;
  public send_channel: Snowflake;
  public receive_channel: Snowflake;
  public activescans: ActiveScan[];
  public remaining: number; // remaining time until next scan

  constructor(
    { id, send_channel, receive_channel }: server
  ) {
    this.id = id;
    this.send_channel = send_channel;
    this.receive_channel = receive_channel;
    this.activescans = [];
    this.remaining = 0;
  }

  public find = (name: string) => {
    return this.activescans.find(scan => scan.name.toLowerCase() === name.toLowerCase());
  }
}

class UsedCode {
  public code: Code;
}

class ScanQuestDB {
  private readonly db: Loki;
  public players: Collection<Player>;
  public servers: Collection<Server>;
  public usedcodes: Collection<UsedCode>;

  constructor() {
    this.db = new Loki(path.resolve(db_path, 'scanquest.db'), {
      adapter: new LokiFSStructuredAdapter(),
      autoload: true,
      autosave: true,
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

        const serverCollection = this.db.getCollection('servers') as Collection<Server>;
        if (serverCollection === null) {
          this.servers = this.db.addCollection('servers');
          this.servers.insertOne(init_server());
        }
        else {
          this.servers = serverCollection;
          if (this.servers.findOne({ id: '135657678633566208' }) === null) {
            this.servers.insertOne(init_server());
          }
        }
      }
    });
  }

  public save = async (member_id: Snowflake, card: Scan) => {
    const player = this.findOnePlayer({ id: member_id });
    player.scans.push(card);
    this.players.update(player);
    return Promise.resolve();
  }

  public is_send_channel = (server_id: Snowflake, channel_id: Snowflake): boolean => {
    const server = this.servers.findOne({ id: server_id });
    if (server === null) return false;
    return (server.send_channel === channel_id);
  }

  public is_receive_channel = (server_id: Snowflake, channel_id: Snowflake): boolean => {
    const server = this.servers.findOne({ id: server_id });
    if (server === null) return false;
    return (server.receive_channel === channel_id);
  }

  public findOnePlayer({ id }: {id: Snowflake}) {
    const player = this.players.findOne({ id: id });
    if (player === null) {
      return this.players.insert({ id, scans: [] }) as Player & LokiObj;
    }
    return player;
  }

  public generateCode(): Code {
    // 0-9 A-F
    // 48-57 65-70
    let code = '';
    let digit = 0;
    do {
      while (digit < 12) {
        const rl = (Math.random() * (126 - 45 + 1)) + 45;
        if (
          (rl >= 48 && rl <= 57) || (rl >= 65 && rl <= 70)
        ) {
          code += `${rl}`;
          digit++;
        }
      }
    } while (this.usedcodes.find({ code: { $eq: code } }));

    this.usedcodes.insertOne({ code });

    return code;
  }
}

// Special setup cases
const init_server = (): Server => {
  const config = {
    send_channel: servers('main').channel('perim'),
    receive_channel: servers('main').channel('bot_commands'),
    test_channel: servers('develop').channel('bot_commands')
  }
  const id = servers('main').id;
  const send_channel = (process.env.NODE_ENV !== 'development') ? config.send_channel : config.test_channel;
  const receive_channel = (process.env.NODE_ENV !== 'development') ? config.receive_channel : config.test_channel;
  return new Server({ id, send_channel, receive_channel });
}

export default ScanQuestDB;
