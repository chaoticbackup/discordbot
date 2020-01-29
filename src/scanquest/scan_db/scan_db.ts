import { Snowflake } from 'discord.js';
import Loki, { Collection } from 'lokijs';
import path from 'path';
import db_path from '../../database/db_path';
import { Scan } from '../scannable/Scannable';
import { Code } from './code';
const LokiFSStructuredAdapter = require('lokijs/src/loki-fs-structured-adapter');

export class Player {
  public id: string;
  public scans: Scan[];
}

export class Server {
  public id: Snowflake;
  public send_channel: Snowflake;
  public recieve_channel: Snowflake;
}

export class UsedCode {
  public code: Code;
}

export class ActiveScan {
  public scan: Scan;
  public expires: Date;
}

class ScanQuestDB {
  private readonly db: Loki;
  public players: Collection<Player>;
  public servers: Collection<Server>;
  public usedcodes: Collection<UsedCode>;
  public activescans: Collection<ActiveScan>;

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

        const activescans = this.db.getCollection('activescans') as Collection<ActiveScan>;
        if (activescans === null) {
          this.activescans = this.db.addCollection('activescans');
        }
        else {
          this.activescans = activescans;
        }

        const servers = this.db.getCollection('servers') as Collection<Server>;
        if (servers === null) {
          this.servers = this.db.addCollection('servers');
        }
        else {
          this.servers = servers;
          if (this.servers.findOne({ id: '135657678633566208' }) === null) {
            this.servers.add({
              id: '135657678633566208',
              send_channel: '656156361029320704',
              recieve_channel: '387805334657433600'
            });
          }
        }
      }
    });
  }

  public save = async (id: Snowflake, card: Scan) => {
    const player = this.findOnePlayer({ id: id });
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
    return (server.recieve_channel === channel_id);
  }

  public findOnePlayer({ id }: {id: Snowflake}) {
    const player = this.players.findOne({ id: id });
    if (player === null) {
      return this.players.insert({ id, scans: [] }) as Player & LokiObj;
    }
    return player;
  }
}

export default ScanQuestDB;
